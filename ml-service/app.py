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
import random
import requests
import concurrent.futures
from bson import ObjectId


load_dotenv()

app = Flask(__name__)
CORS(app)

MONGO_USER = os.getenv("MONGO_INITDB_ROOT_USERNAME")
MONGO_PASS = os.getenv("MONGO_INITDB_ROOT_PASSWORD")
MONGO_HOST = "centerbeam.proxy.rlwy.net"
MONGO_PORT = "10551"
MONGO_DB = "auth_db"

MONGO_URI = f"mongodb://{MONGO_USER}:{MONGO_PASS}@{MONGO_HOST}:{MONGO_PORT}/{MONGO_DB}?authSource=admin"

client = MongoClient(MONGO_URI)

# Connect to the specific database and collection
db = client["auth_db"]
users_collection = db["users"]

# Log MongoDB connection status
try:
    db.command("ping")  # Test connection
    print("✅ Successfully connected to MongoDB!", flush=True) 
except Exception as e:
    print(f"❌ MongoDB Connection Failed: {e}", flush=True)

# Debugging logs for RabbitMQ connection
print(f"🐇 Attempting to connect to RabbitMQ at {os.getenv('RABBITMQ_HOST')}:{os.getenv('RABBITMQ_PORT')} "
      f"with user '{os.getenv('RABBITMQ_USERNAME')}'")

# Initialize RabbitMQ Connection
rabbitmq_connection = RabbitMQConnection(
    host=os.getenv("RABBITMQ_HOST"),
    port=int(os.getenv("RABBITMQ_PORT")), 
    username=os.getenv("RABBITMQ_USERNAME"),
    password=os.getenv("RABBITMQ_PASSWORD")
)


try:
    rabbitmq_connection.connect()
    print("✅ RabbitMQ Connection Successful!", flush=True)
except Exception as e:
    print(f"❌ Error connecting to RabbitMQ: {e}", flush=True)


# Define tier categories and weight mapping
tiers = ["S", "A", "B", "C", "D", "E", "F"]
tier_weights = {"S": 6, "A": 5, "B": 4, "C": 3, "D": 2, "E": 1, "F": 0}


# Define images
images = [
    "Roronoa_Zoro",
    "Monkey_D_Luffy",
    "Sanji",
    "Nami",
    "Usopp",
    "Franky",
    "Brook",
    "Tony_Tony_Chopper",
    "Nico_Robin",
    "Jinbe"
]

@app.route("/generate_test_tier_lists", methods=["POST"])
def generate_test_tier_lists():
    """Generates test tier lists for 7 users and submits them directly (no API call)."""
    users = list(users_collection.find({}, {"_id": 1}))  # Get user IDs only

    if len(users) < 7:
        print(f"⚠️ Not enough users! Found {len(users)}, need at least 7.", flush=True)
        return jsonify({"error": f"Not enough users in MongoDB! Found {len(users)}, need at least 7."}), 400

    def submit_tier_list_direct(user_id, tier_list):
        """Directly call the function instead of making an API request."""
        with app.app_context():
            data = {"user_id": user_id, "tier_list": tier_list}
            response = submit_tier_list_directly(data)  # Direct function call
            if response.get("message"):
                print(f"✅ Submitted tier list for {user_id}", flush=True)
            else:
                print(f"❌ Failed to submit for {user_id}", flush=True)

    # Use ThreadPoolExecutor for parallel execution
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        future_to_user = {}
        for user in users[:7]:
            user_id = str(user["_id"])
            tier_list = {image: random.choice(tiers) for image in images}
            print(f"📝 Generated tier list for {user_id}: {tier_list}", flush=True)

            # Run submission directly inside Flask without an API call
            future_to_user[executor.submit(submit_tier_list_direct, user_id, tier_list)] = user_id

        # Wait for all tasks to complete
        for future in concurrent.futures.as_completed(future_to_user):
            user_id = future_to_user[future]
            try:
                future.result()  # Get results to catch exceptions
            except Exception as exc:
                print(f"⚠️ Tier list submission failed for {user_id}: {exc}", flush=True)

    return jsonify({"message": "Test tier lists generated and submitted!"})

def submit_tier_list_directly(data):
    """Direct function call version of submit_tier_list."""
    global model

    user_id = data.get("user_id")
    tier_list = data.get("tier_list")

    if not user_id or not tier_list:
        return {"error": "Missing user_id or tier_list"}

    print(f"Received tier list for user: {user_id}", flush=True)

    # Store tier list
    user_tier_lists.append({"user_id": user_id, "tier_list": tier_list})

    # Train Word2Vec model if not already trained
    if model is None:
        print("Training Word2Vec model...", flush=True)
        training_data = [[image for image, tier in user["tier_list"].items() if tier == t]
                         for user in user_tier_lists for t in tiers]
        training_data = [group for group in training_data if group]  # Remove empty tiers
        if training_data:
            model = Word2Vec(sentences=training_data, vector_size=50, window=5, min_count=1, workers=4, epochs=50)
            print("✅ Word2Vec model trained successfully!", flush=True)
        else:
            print("⚠️ No training data available!", flush=True)

    # Compute user embedding
    embedding = get_user_embedding(tier_list)

    if embedding is not None and embedding.shape[0] > 0:
        user_embeddings[user_id] = embedding
        print(f"✅ Stored embedding for {user_id}: {embedding[:5]}...", flush=True)  # Show first 5 values
    else:
        print(f"⚠️ No valid embedding for {user_id}!", flush=True)

    print(f"📊 Total Users with Embeddings: {len(user_embeddings)}", flush=True)

    return {"message": "Tier list submitted successfully!", "user_id": user_id}




@app.route("/run_matching_now", methods=["POST"])
def run_matching_now():
    """Manually triggers the scheduled matching process."""
    print("🚀 Manually triggering daily matching...")
    schedule_daily_matching()
    return jsonify({"message": "Daily matching process triggered successfully!"})
 



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

    print(f"Received tier list for user: {user_id}", flush=True)

    # Store tier list
    user_tier_lists.append({"user_id": user_id, "tier_list": tier_list})

    # Train Word2Vec model if not already trained
    if model is None:
        print("Training Word2Vec model...", flush=True)
        training_data = [[image for image, tier in user["tier_list"].items() if tier == t] 
                         for user in user_tier_lists for t in tiers]
        training_data = [group for group in training_data if group]  # Remove empty tiers
        if training_data:
            model = Word2Vec(sentences=training_data, vector_size=50, window=5, min_count=1, workers=4, epochs=50)
            print("✅ Word2Vec model trained successfully!", flush=True)
        else:
            print("⚠️ No training data available!", flush=True)

    # Compute user embedding
    embedding = get_user_embedding(tier_list)

    if embedding is not None and embedding.shape[0] > 0:
        user_embeddings[user_id] = embedding
        print(f"✅ Stored embedding for {user_id}: {embedding[:5]}...", flush=True)  # Show first 5 values
    else:
        print(f"⚠️ No valid embedding for {user_id}!", flush=True)

    print(f"📊 Total Users with Embeddings: {len(user_embeddings)}", flush=True)

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
    """Runs the daily matching process and prints debug info."""
    global daily_matches
    print(f"🚀 Running daily matching at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}...", flush=True)

    # Check if user embeddings exist
    if not user_embeddings:
        print("⚠️ No user embeddings found! Ensure tier lists are submitted before matching.", flush=True)
        return

    print(f"🔍 Total Users with Embeddings: {len(user_embeddings)}", flush=True)

    daily_matches = {}  # Reset matches for the new day
    for user_id in user_embeddings.keys():
        print(f"🔍 Checking matches for {user_id}...", flush=True)
        matches = find_top_matches(user_id, top_n=5)

        # Debug: Show retrieved matches
        if not matches:
            print(f"⚠️ No matches found for {user_id}.", flush=True)
        else:
            print(f"📊 Matches for User {user_id}: {[match['user_id'] for match in matches]}", flush=True)

        # Send matches to RabbitMQ
        for match in matches:
            match_id = match['user_id']
            rabbitmq_connection.send_match(user_id, match_id)
            print(f"📤 Sent match {user_id} -> {match_id} to RabbitMQ", flush=True)

        daily_matches[user_id] = [match["user_id"] for match in matches]

    print("✅ Daily matching completed!", flush=True)



def get_user_info(user_id):
    """Retrieve user info from MongoDB by _id or username."""
    
    # Check if user_id is an ObjectId
    query = {"_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"username": user_id}

    user = users_collection.find_one(query)
    if user:
        return {
            "sex": user.get("gender", "unknown"),  # MongoDB uses "gender" instead of "sex"
            "lookingFor": user.get("lookingFor", "both"),
            "username": user.get("username"),
            "email": user.get("email"),
            "age": user.get("age"),
        }
    return None

@app.route("/get_all_users", methods=["GET"])
def get_all_users():
    """Fetches all users from MongoDB."""
    users = list(users_collection.find({}, {"password": 0}))  # Exclude password for security
    for user in users:
        user["_id"] = str(user["_id"])  # Convert ObjectId to string for JSON
    return jsonify(users)


def is_match_compatible(user_sex, user_looking_for, other_sex, other_looking_for):
    print(f"🧐 Checking: {user_sex} ({user_looking_for}) vs {other_sex} ({other_looking_for})")

    # Both users must match each other's criteria
    if (user_looking_for in [other_sex, "both"]) and (other_looking_for in [user_sex, "both"]):
        print("✅ Gender compatible!")
        return True

    print("❌ Final default case: No match.")
    return False






def find_top_matches(user_id, top_n=5):
    """Finds closest users to a given user based on clustering and prints debug info."""
    if user_id not in user_embeddings:
        print(f"⚠️ User {user_id} not found in embeddings!", flush=True)
        return []

    # Convert user embeddings to a NumPy matrix
    user_ids = list(user_embeddings.keys())
    embeddings_matrix = np.array([user_embeddings[uid] for uid in user_ids])

    print(f"🔍 Running clustering on {len(user_ids)} users...", flush=True)

    # Perform Agglomerative Clustering
    clustering = AgglomerativeClustering(n_clusters=None, distance_threshold=1.0, linkage="ward")
    cluster_labels = clustering.fit_predict(embeddings_matrix)

    # Identify the cluster of the given user
    user_index = user_ids.index(user_id)
    user_cluster = cluster_labels[user_index]

    print(f"👥 User {user_id} is in cluster {user_cluster}", flush=True)

    # Retrieve user info
    user_info = get_user_info(user_id)
    if not user_info:
        print(f"⚠️ User info not found for {user_id}", flush=True)
        return []

    user_sex = user_info.get("sex")
    user_looking_for = user_info.get("lookingFor")

    # Find users in the same cluster
    matches = []
    for i, other_id in enumerate(user_ids):
        if cluster_labels[i] == user_cluster and other_id != user_id:
            other_user_info = get_user_info(other_id)

            if other_user_info:
                print(f"🧐 Checking {user_id} ({user_sex}, {user_looking_for}) vs {other_id} ({other_user_info['sex']}, {other_user_info['lookingFor']})", flush=True)

            if other_user_info and is_match_compatible(user_sex, user_looking_for, other_user_info["sex"], other_user_info["lookingFor"]):
                print(f"✅ Match found: {user_id} ↔ {other_id}", flush=True)
                matches.append({"user_id": other_id})
            else:
                print(f"❌ Match failed for {user_id} ↔ {other_id}", flush=True)

    print(f"✅ Found {len(matches)} matches for {user_id}: {[m['user_id'] for m in matches]}", flush=True)

    return matches  # Return all matches found, not just the top 5




# Schedule the daily matching at 5 PM
scheduler = BackgroundScheduler()
scheduler.add_job(schedule_daily_matching, 'cron', hour=17, minute=58)  # 17:00 = 5 PM
scheduler.start()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8086))
    app.run(host="0.0.0.0", port=port)
    
    # Close RabbitMQ connection when the app exits
    rabbitmq_connection.close_connection()
