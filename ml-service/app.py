import os
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from gensim.models import Word2Vec
from sklearn.cluster import AgglomerativeClustering
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
from dotenv import load_dotenv
from rabbitmq import RabbitMQConnection
from pymongo import MongoClient

load_dotenv()

app = Flask(__name__)
CORS(app)

MONGO_URI = os.getenv("MONGO_URI", "mongodb://centerbeam.proxy.rlwy.net:10551/auth_db")
client = MongoClient(MONGO_URI)

# Connect to the specific database and collection
db = client["auth_db"]
users_collection = db["users"]

# Connect to RabbitMQ
rabbitmq_connection = RabbitMQConnection(
    host=os.getenv("RABBITMQ_HOST", "localhost"),
    port=os.getenv("RABBITMQ_PORT", 5672),
    username=os.getenv("RABBITMQ_USERNAME", "guest"),
    password=os.getenv("RABBITMQ_PASSWORD", "guest")
)

try:
    rabbitmq_connection.connect()
except Exception as e:
    print(f"Error connecting to RabbitMQ: {e}")

# Define tier categories and weight mapping
tiers = ["S", "A", "B", "C", "D", "E", "F"]
tier_weights = {"S": 6, "A": 5, "B": 4, "C": 3, "D": 2, "E": 1, "F": 0}

# Store user embeddings and tier lists
user_embeddings = {}
user_tier_lists = []
model = None  # Placeholder for Word2Vec model
daily_matches = {}  # Store matches for all users

@app.route("/")
def home():
    return jsonify({"message": "Flask API is running with scheduled matching!"})

@app.route("/submit_tier_list", methods=["POST"])
def submit_tier_list():
    """Receives a user's tier list, computes the embedding, and stores it."""
    global model

    data = request.json
    user_id = data.get("user_id")
    tier_list = data.get("tier_list")

    if not user_id or not tier_list:
        return jsonify({"error": "Missing user_id or tier_list"}), 400

    print(f"Received tier list for user: {user_id}")

    # Store tier list
    user_tier_lists.append({"user_id": user_id, "tier_list": tier_list})

    # Train Word2Vec model if not already trained
    if model is None:
        print("Training Word2Vec model...")
        training_data = [[image for image, tier in user["tier_list"].items() if tier == t] 
                         for user in user_tier_lists for t in tiers]
        training_data = [group for group in training_data if group]  # Remove empty tiers
        if training_data:
            model = Word2Vec(sentences=training_data, vector_size=50, window=5, min_count=1, workers=4, epochs=50)
        else:
            print("No training data available!")

    # Compute user embedding
    embedding = get_user_embedding(tier_list)

    if embedding is not None and embedding.shape[0] > 0:
        user_embeddings[user_id] = embedding
    else:
        print(f"Warning: No valid embedding for {user_id}!")

    print(f"Stored Users: {list(user_embeddings.keys())}")  # Debugging output

    return jsonify({"message": "Tier list submitted successfully!", "user_id": user_id})

def get_user_embedding(user_tier_list):
    """Compute a user's embedding by averaging word vectors with weighted tiers."""
    weighted_vectors = []
    
    for image, tier in user_tier_list.items():
        if model and image in model.wv:
            weighted_vectors.append(model.wv[image] * tier_weights[tier])
        else:
            print(f"{image} not in model vocabulary!")

    if weighted_vectors:
        embedding = np.mean(weighted_vectors, axis=0)
        print(f"Computed embedding: {embedding[:5]}...")  # Show first 5 values
        return embedding
    else:
        print("No valid embeddings found!")
        return np.zeros(50)  # Ensure we return a valid array

@app.route("/get_matches", methods=["GET"])
def get_matches():
    """Returns all users' top 5 matches after the scheduled match time."""
    return jsonify({"daily_matches": daily_matches})

def schedule_daily_matching():
    """Runs the daily matching process at 5 PM."""
    global daily_matches
    print(f"Running daily matching at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}...")

    daily_matches = {}  # Reset matches for the new day
    for user_id in user_embeddings.keys():
        matches = find_top_matches(user_id, top_n=5)
        
        # Send User ID and Match to Queue
        for match in matches:
            user_id = match['user_id'] # Get the user ID
            match_id = match['match']['user_id'] # Get the match ID
            # Send match to RabbitMQ
            rabbitmq_connection.send_match(user_id, match_id)
            
        daily_matches[user_id] = [match["user_id"] for match in matches]

    print("Daily matching completed!")

def get_user_info(user_id):
    """Retrieve user info from MongoDB by user_id."""
    user = users_collection.find_one({"user_id": user_id})  
    if user:
        return {
            "sex": user.get("sex", "unknown"), 
            "lookingFor": user.get("lookingFor", "both")
        }
    return None

def is_match_compatible(user_sex, user_looking_for, other_sex, other_looking_for):
    """Checks if two users are compatible based on their sex and lookingFor preferences."""
    
    # Male looking for female → Match with female looking for male or both
    if user_sex == "male" and user_looking_for == "female":
        return other_sex == "female" and other_looking_for in ["male", "both"]

    # Female looking for male → Match with male looking for female or both
    elif user_sex == "female" and user_looking_for == "male":
        return other_sex == "male" and other_looking_for in ["female", "both"]

    # Male looking for both → Match with:
    # 1. Other males looking for both
    # 2. Females looking for male
    elif user_sex == "male" and user_looking_for == "both":
        return (other_sex == "male" and other_looking_for in ["both", "male"]) or (other_sex == "female" and other_looking_for == "male")

    # Female looking for both → Match with:
    # 1. Other females looking for both
    # 2. Males looking for female
    elif user_sex == "female" and user_looking_for == "both":
        return (other_sex == "female" and other_looking_for in ["both", "female"]) or (other_sex == "male" and other_looking_for == "female")

    # Male looking for male → Match with:
    # 1. Other males looking for male
    # 2. Other males looking for both
    elif user_sex == "male" and user_looking_for == "male":
        return other_sex == "male" and other_looking_for in ["male", "both"]

    # Female looking for female → Match with:
    # 1. Other females looking for female
    # 2. Other females looking for both
    elif user_sex == "female" and user_looking_for == "female":
        return other_sex == "female" and other_looking_for in ["female", "both"]

    # If none of the conditions match, return False
    return False



def find_top_matches(user_id, top_n=5):
    """Finds the closest users to a given user based on Agglomerative Clustering while considering sex and lookingFor preferences."""
    if user_id not in user_embeddings:
        print(f"User {user_id} not found in embeddings!")
        return []

    # Convert user embeddings to a NumPy matrix
    user_ids = list(user_embeddings.keys())
    embeddings_matrix = np.array([user_embeddings[uid] for uid in user_ids])

    # Perform Agglomerative Clustering
    clustering = AgglomerativeClustering(n_clusters=None, distance_threshold=1.5, linkage="ward")
    cluster_labels = clustering.fit_predict(embeddings_matrix)

    # Identify the cluster of the given user
    user_index = user_ids.index(user_id)
    user_cluster = cluster_labels[user_index]

    # Retrieve user info
    user_info = get_user_info(user_id)
    if not user_info:
        print(f"User info not found for {user_id}")
        return []

    user_sex = user_info.get("sex")
    user_looking_for = user_info.get("lookingFor")

    # Find users in the same cluster
    matches = []
    for i, other_id in enumerate(user_ids):
        if cluster_labels[i] == user_cluster and other_id != user_id:
            other_user_info = get_user_info(other_id)

            # Check if the match is compatible based on sex/lookingFor preferences
            if other_user_info and is_match_compatible(user_sex, user_looking_for, other_user_info["sex"], other_user_info["lookingFor"]):
                matches.append({"user_id": other_id})

    return matches[:top_n]


# Schedule the daily matching at 5 PM
scheduler = BackgroundScheduler()
scheduler.add_job(schedule_daily_matching, 'cron', hour=17, minute=58)  # 17:00 = 5 PM
scheduler.start()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8086))
    app.run(host="0.0.0.0", port=port)
    
    # Close RabbitMQ connection when the app exits
    rabbitmq_connection.close_connection()
