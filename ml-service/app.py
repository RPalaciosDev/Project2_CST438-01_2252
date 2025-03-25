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
import pickle
import gridfs


load_dotenv()

app = Flask(__name__)
# Configure CORS to allow requests from all frontend domains
CORS(app, resources={r"/*": {"origins": [
    "https://frontend-production-c2bc.up.railway.app",
    "https://frontend-production.up.railway.app",
    "https://ml-matching.up.railway.app",
    "https://ml-service-production.up.railway.app",
    "http://localhost:8081",
    "http://localhost:3000",
    "http://localhost:19006",
    "http://localhost:19000",
    "exp://localhost:19000"
], "methods": ["GET", "POST", "OPTIONS"], "allow_headers": ["Content-Type", "Authorization"]}})

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
# Add collections for persistence
user_embeddings_collection = db["user_embeddings"]
tier_lists_collection = db["tier_lists"]
matches_collection = db["matches"]
# Set up GridFS for storing model
fs = gridfs.GridFS(db)

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

    # Store tier list in memory
    user_tier_lists.append({"user_id": user_id, "tier_list": tier_list})
    
    # Save tier list to MongoDB
    tier_lists_collection.update_one(
        {"user_id": user_id},
        {"$set": {"tier_list": tier_list, "timestamp": datetime.now()}},
        upsert=True
    )
    print(f"💾 Saved tier list to MongoDB for user: {user_id}", flush=True)

    # Train Word2Vec model if not already trained
    if model is None:
        train_model()

    # Compute user embedding
    embedding = get_user_embedding(tier_list)

    if embedding is not None and embedding.shape[0] > 0:
        # Store in memory
        user_embeddings[user_id] = embedding
        
        # Store in MongoDB - convert numpy array to list for BSON serialization
        embedding_list = embedding.tolist()
        user_embeddings_collection.update_one(
            {"user_id": user_id},
            {"$set": {"embedding": embedding_list, "timestamp": datetime.now()}},
            upsert=True
        )
        print(f"💾 Saved embedding to MongoDB for user: {user_id}", flush=True)
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
 



# Store user embeddings and tier lists (keeping in-memory for runtime use, but now with persistence)
user_embeddings = {}
user_tier_lists = []
model = None  # Placeholder for Word2Vec model
daily_matches = {}  # Store matches for all users

# Load existing embeddings and tier lists from MongoDB on startup
def load_data_from_mongodb():
    """Load existing embeddings and tier lists from MongoDB on service startup"""
    global user_embeddings, user_tier_lists, daily_matches, model
    
    print("📂 Loading data from MongoDB...", flush=True)
    
    # Load embeddings
    embeds_cursor = user_embeddings_collection.find({})
    for embed_doc in embeds_cursor:
        user_id = embed_doc.get("user_id")
        embedding = np.array(embed_doc.get("embedding"))
        if user_id and embedding is not None:
            user_embeddings[user_id] = embedding
    
    # Load tier lists
    tiers_cursor = tier_lists_collection.find({})
    for tier_doc in tiers_cursor:
        user_id = tier_doc.get("user_id")
        tier_list = tier_doc.get("tier_list")
        if user_id and tier_list:
            user_tier_lists.append({"user_id": user_id, "tier_list": tier_list})
    
    # Load matches
    matches_cursor = matches_collection.find({})
    for match_doc in matches_cursor:
        user_id = match_doc.get("user_id")
        matches = match_doc.get("matches", [])
        if user_id and matches:
            daily_matches[user_id] = matches
    
    # Load Word2Vec model if it exists
    model_files = list(db.fs.files.find({"filename": "word2vec_model"}).sort("uploadDate", -1).limit(1))
    if model_files:
        model_file = model_files[0]
        model_id = model_file["_id"]
        print(f"📥 Found saved model with ID: {model_id}", flush=True)
        try:
            model_bytes = fs.get(model_id).read()
            model = pickle.loads(model_bytes)
            print("✅ Successfully loaded Word2Vec model from MongoDB", flush=True)
        except Exception as e:
            print(f"❌ Error loading model: {e}", flush=True)
            model = None
    
    print(f"✅ Loaded {len(user_embeddings)} embeddings, {len(user_tier_lists)} tier lists, and {len(daily_matches)} match sets", flush=True)

# Load data on startup
load_data_from_mongodb()

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
        print(f"⚠️ Missing user_id or tier_list in submission", flush=True)
        return jsonify({"error": "Missing user_id or tier_list"}), 400

    print(f"🔍 Processing tier list submission for user: {user_id}", flush=True)

    # Store tier list in memory
    user_tier_lists.append({"user_id": user_id, "tier_list": tier_list})
    
    # Save tier list to MongoDB
    try:
        tier_lists_collection.update_one(
            {"user_id": user_id},
            {"$set": {"tier_list": tier_list, "timestamp": datetime.now()}},
            upsert=True
        )
        print(f"💾 Saved tier list to MongoDB for user: {user_id}", flush=True)
    except Exception as e:
        print(f"❌ Error saving tier list to MongoDB: {e}", flush=True)

    # Train Word2Vec model if not already trained
    if model is None:
        print(f"🔄 No model exists, training new model...", flush=True)
        train_model()

    # Compute user embedding
    print(f"⚙️ Computing embedding for user: {user_id}", flush=True)
    embedding = get_user_embedding(tier_list)

    if embedding is not None and embedding.shape[0] > 0:
        # Store in memory
        user_embeddings[user_id] = embedding
        
        # Store in MongoDB - convert numpy array to list for BSON serialization
        try:
            embedding_list = embedding.tolist()
            user_embeddings_collection.update_one(
                {"user_id": user_id},
                {"$set": {"embedding": embedding_list, "timestamp": datetime.now()}},
                upsert=True
            )
            print(f"💾 Saved embedding to MongoDB for user: {user_id}", flush=True)
        except Exception as e:
            print(f"❌ Error saving embedding to MongoDB: {e}", flush=True)
    else:
        print(f"⚠️ No valid embedding for {user_id}!", flush=True)

    print(f"📊 Total Users with Embeddings: {len(user_embeddings)}", flush=True)
    
    # Immediately find matches for this user
    print(f"🔍 Finding immediate matches for user: {user_id}", flush=True)
    matches = find_top_matches(user_id, top_n=5)
    
    if matches:
        print(f"✅ Found {len(matches)} matches for user {user_id}", flush=True)
        # Save matches to MongoDB
        try:
            matches_collection.update_one(
                {"user_id": user_id},
                {"$set": {
                    "matches": [match["user_id"] for match in matches],
                    "timestamp": datetime.now()
                }},
                upsert=True
            )
            print(f"💾 Saved matches to MongoDB for user: {user_id}", flush=True)
            
            # Send matches to RabbitMQ
            send_matches_to_rabbitmq(user_id, matches)
            
            # Store in daily matches for API access
            daily_matches[user_id] = [match["user_id"] for match in matches]
            
        except Exception as e:
            print(f"❌ Error saving matches to MongoDB: {e}", flush=True)
    else:
        print(f"ℹ️ No matches found for user {user_id}", flush=True)

    return jsonify({
        "message": "Tier list submitted successfully!", 
        "user_id": user_id,
        "matches_found": len(matches) if matches else 0
    })

# Function to send matches to RabbitMQ with retry logic
def send_matches_to_rabbitmq(user_id, matches):
    """Send matches to RabbitMQ with retry logic"""
    print(f"📤 Sending {len(matches)} matches to RabbitMQ for user {user_id}", flush=True)
    
    # Ensure RabbitMQ connection is active
    if not rabbitmq_connection.ensure_connection():
        print(f"⚠️ RabbitMQ connection unavailable, matches may not be delivered for {user_id}", flush=True)
    
    # Send matches with retry logic
    failed_matches = []
    for match in matches:
        match_id = match['user_id']
        print(f"🔄 Attempting to send match {user_id} -> {match_id} to RabbitMQ", flush=True)
        
        # Try to send match to RabbitMQ
        send_success = rabbitmq_connection.send_match(user_id, match_id)
        if send_success:
            print(f"✅ Sent match {user_id} -> {match_id} to RabbitMQ", flush=True)
        else:
            failed_matches.append(match_id)
            print(f"⚠️ Failed to deliver match {user_id} -> {match_id} to RabbitMQ", flush=True)
    
    # Retry failed matches once more
    if failed_matches:
        print(f"🔄 Retrying {len(failed_matches)} failed match deliveries for {user_id}...", flush=True)
        # Ensure connection is active
        rabbitmq_connection.ensure_connection()
        
        still_failed = []
        for match_id in failed_matches:
            if rabbitmq_connection.send_match(user_id, match_id):
                print(f"✅ Retry successful: {user_id} -> {match_id}", flush=True)
            else:
                still_failed.append(match_id)
                print(f"❌ Retry failed: {user_id} -> {match_id}", flush=True)
        
        if still_failed:
            print(f"⚠️ {len(still_failed)} matches could not be delivered to RabbitMQ for {user_id}", flush=True)
    
    return len(failed_matches) == 0  # Return True if all messages were sent successfully

def get_user_embedding(user_tier_list):
    """Compute a user's embedding by averaging word vectors with weighted tiers."""
    print(f"⚙️ Computing embedding from tier list with {len(user_tier_list)} items", flush=True)
    weighted_vectors = []
    
    for image, tier in user_tier_list.items():
        if model and image in model.wv:
            weighted_vectors.append(model.wv[image] * tier_weights[tier])
            print(f"➕ Added weighted vector for {image} (tier {tier})", flush=True)
        else:
            print(f"⚠️ {image} not in model vocabulary!", flush=True)

    if weighted_vectors:
        embedding = np.mean(weighted_vectors, axis=0)
        print(f"✅ Computed embedding of dimension {embedding.shape}", flush=True)
        return embedding
    else:
        print("⚠️ No valid embeddings found! Returning zero vector", flush=True)
        return np.zeros(50)  # Ensure we return a valid array

@app.route("/get_matches", methods=["GET"])
def get_matches():
    """Returns all users' top 5 matches after the scheduled match time."""
    # Option to get matches for a specific user
    user_id = request.args.get("user_id")
    
    if user_id:
        # Get matches from MongoDB for specific user
        match_doc = matches_collection.find_one({"user_id": user_id})
        if match_doc:
            return jsonify({"matches": match_doc.get("matches", [])})
        return jsonify({"matches": []})
    
    # Otherwise return all matches
    return jsonify({"daily_matches": daily_matches})

def schedule_daily_matching():
    """Runs the daily matching process as a backup/sync mechanism."""
    global daily_matches
    print(f"🔄 Running scheduled matching at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}...", flush=True)

    # Check if user embeddings exist
    if not user_embeddings:
        print("⚠️ No user embeddings found! Ensure tier lists are submitted before matching.", flush=True)
        return

    print(f"📊 Daily matching for {len(user_embeddings)} users with embeddings", flush=True)

    # Keep track of processed matches
    processed_count = 0
    new_matches_count = 0
    
    # For each user with embeddings, find matches if they don't already have recent ones
    for user_id in user_embeddings.keys():
        # Check if user already has matches in MongoDB from today
        existing_matches = matches_collection.find_one({"user_id": user_id})
        
        if existing_matches and "timestamp" in existing_matches:
            match_time = existing_matches["timestamp"]
            if match_time.date() == datetime.now().date():
                # User already has matches from today, skip
                print(f"⏭️ User {user_id} already has matches from today, skipping", flush=True)
                # Still update the daily_matches dict for API access
                daily_matches[user_id] = existing_matches.get("matches", [])
                processed_count += 1
                continue
                
        print(f"🔍 Finding matches for user {user_id}...", flush=True)
        matches = find_top_matches(user_id, top_n=5)

        if not matches:
            print(f"⚠️ No matches found for {user_id}.", flush=True)
            continue
            
        print(f"✅ Found {len(matches)} matches for {user_id}", flush=True)
        new_matches_count += 1
        
        # Save to MongoDB
        matches_collection.update_one(
            {"user_id": user_id},
            {"$set": {
                "matches": [match["user_id"] for match in matches],
                "timestamp": datetime.now()
            }},
            upsert=True
        )
        
        # Update in-memory cache
        daily_matches[user_id] = [match["user_id"] for match in matches]
        
        # Send to RabbitMQ
        send_matches_to_rabbitmq(user_id, matches)
        
        processed_count += 1

    print(f"✅ Scheduled matching completed: Processed {processed_count} users, {new_matches_count} new match sets generated", flush=True)



def get_user_info(user_id):
    """Retrieve user info from MongoDB by _id or username."""
    
    # Check if user_id is an ObjectId
    query = {"_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"username": user_id}

    user = users_collection.find_one(query)
    if user:
        # Extract the gender (lowercase for consistency)
        gender = user.get("gender", "")
        if gender:
            gender = gender.lower()
        
        # Extract the lookingFor field - ensure it's a string
        looking_for = user.get("lookingFor", "both")
        if not looking_for:
            looking_for = "both"  # Default if missing or empty
            
        # Log the extracted user info
        print(f"📊 User info for {user_id}: gender={gender}, lookingFor={looking_for}")
        
        return {
            "sex": gender,  # MongoDB uses "gender" instead of "sex"
            "lookingFor": looking_for,
            "username": user.get("username"),
            "email": user.get("email"),
            "age": user.get("age"),
        }
    print(f"⚠️ User not found: {user_id}")
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
    
    # Split lookingFor fields by comma and strip whitespace
    user_preferences = [pref.strip().lower() for pref in user_looking_for.split(',')] if user_looking_for else []
    other_preferences = [pref.strip().lower() for pref in other_looking_for.split(',')] if other_looking_for else []
    
    # Normalize genders to lowercase for comparison
    user_sex_lower = user_sex.lower() if user_sex else ""
    other_sex_lower = other_sex.lower() if other_sex else ""
    
    print(f"📋 User {user_sex_lower} preferences: {user_preferences}")
    print(f"📋 Other {other_sex_lower} preferences: {other_preferences}")
    
    # Check if each user's gender is in the other's preferences
    user_matches_other_prefs = user_sex_lower in other_preferences or "both" in other_preferences or "any" in other_preferences
    other_matches_user_prefs = other_sex_lower in user_preferences or "both" in user_preferences or "any" in user_preferences
    
    # Both conditions must be true for a match
    if user_matches_other_prefs and other_matches_user_prefs:
        print("✅ Gender compatible!")
        return True
        
    if not user_matches_other_prefs:
        print(f"❌ User's gender ({user_sex_lower}) not in other's preferences: {other_preferences}")
    if not other_matches_user_prefs:
        print(f"❌ Other's gender ({other_sex_lower}) not in user's preferences: {user_preferences}")
        
    print("❌ Final result: No match.")
    return False






def find_top_matches(user_id, top_n=5):
    """Finds closest users to a given user based on clustering and prints debug info."""
    if user_id not in user_embeddings:
        print(f"⚠️ User {user_id} not found in embeddings!", flush=True)
        return []

    # Convert user embeddings to a NumPy matrix
    user_ids = list(user_embeddings.keys())
    print(f"🔍 Finding matches among {len(user_ids)} users with embeddings", flush=True)
    
    if len(user_ids) < 2:
        print("⚠️ Not enough users with embeddings for matching (minimum 2 required)", flush=True)
        return []
        
    embeddings_matrix = np.array([user_embeddings[uid] for uid in user_ids])
    print(f"📊 Created embeddings matrix of shape {embeddings_matrix.shape}", flush=True)

    try:
        # Perform Agglomerative Clustering
        print(f"🧮 Running Agglomerative Clustering with distance_threshold=1.0", flush=True)
        clustering = AgglomerativeClustering(n_clusters=None, distance_threshold=1.0, linkage="ward")
        cluster_labels = clustering.fit_predict(embeddings_matrix)
        print(f"✅ Clustering complete. Found {len(set(cluster_labels))} clusters", flush=True)

        # Identify the cluster of the given user
        user_index = user_ids.index(user_id)
        user_cluster = cluster_labels[user_index]

        print(f"👥 User {user_id} is in cluster {user_cluster} with {list(cluster_labels).count(user_cluster)} users", flush=True)

        # Retrieve user info
        user_info = get_user_info(user_id)
        if not user_info:
            print(f"⚠️ User info not found for {user_id}", flush=True)
            return []

        user_sex = user_info.get("sex")
        user_looking_for = user_info.get("lookingFor")
        print(f"👤 User {user_id} details: gender={user_sex}, lookingFor={user_looking_for}", flush=True)

        # Find users in the same cluster
        matches = []
        users_checked = 0
        users_in_same_cluster = 0
        
        for i, other_id in enumerate(user_ids):
            if cluster_labels[i] == user_cluster and other_id != user_id:
                users_in_same_cluster += 1
                users_checked += 1
                
                print(f"🔍 Checking user in same cluster: {other_id}", flush=True)
                other_user_info = get_user_info(other_id)

                if not other_user_info:
                    print(f"⚠️ Could not retrieve user info for {other_id}", flush=True)
                    continue

                print(f"🧐 Checking compatibility: {user_id} ({user_sex}, {user_looking_for}) vs {other_id} ({other_user_info['sex']}, {other_user_info['lookingFor']})", flush=True)

                if is_match_compatible(user_sex, user_looking_for, other_user_info["sex"], other_user_info["lookingFor"]):
                    print(f"✅ Match found: {user_id} ↔ {other_id}", flush=True)
                    matches.append({"user_id": other_id})
                else:
                    print(f"❌ Match failed for {user_id} ↔ {other_id}", flush=True)
        
        print(f"📊 Matching stats: Checked {users_checked} users, {users_in_same_cluster} in same cluster, found {len(matches)} compatible matches", flush=True)

        # If not enough matches in the same cluster, consider users from other clusters
        if len(matches) < top_n:
            print(f"⚠️ Not enough matches in same cluster ({len(matches)}), checking other clusters", flush=True)
            for i, other_id in enumerate(user_ids):
                if cluster_labels[i] != user_cluster and other_id != user_id and len(matches) < top_n:
                    users_checked += 1
                    
                    print(f"🔍 Checking user in different cluster: {other_id}", flush=True)
                    other_user_info = get_user_info(other_id)

                    if not other_user_info:
                        print(f"⚠️ Could not retrieve user info for {other_id}", flush=True)
                        continue

                    print(f"🧐 Checking compatibility: {user_id} ({user_sex}, {user_looking_for}) vs {other_id} ({other_user_info['sex']}, {other_user_info['lookingFor']})", flush=True)

                    if is_match_compatible(user_sex, user_looking_for, other_user_info["sex"], other_user_info["lookingFor"]):
                        print(f"✅ Match found: {user_id} ↔ {other_id}", flush=True)
                        matches.append({"user_id": other_id})
                    else:
                        print(f"❌ Match failed for {user_id} ↔ {other_id}", flush=True)
            
            print(f"📊 Extended matching stats: Checked {users_checked} users total, found {len(matches)} compatible matches", flush=True)

        return matches  # Return all matches found
    
    except Exception as e:
        print(f"❌ Error during matching: {e}", flush=True)
        import traceback
        traceback.print_exc()
        return []




def train_model():
    """Train Word2Vec model and save it to MongoDB."""
    global model
    
    print("🧠 Training Word2Vec model...", flush=True)
    training_data = [[image for image, tier in user["tier_list"].items() if tier == t]
                     for user in user_tier_lists for t in tiers]
    training_data = [group for group in training_data if group]  # Remove empty tiers
    
    print(f"📚 Training data: {len(training_data)} groups", flush=True)
    
    if training_data:
        try:
            print(f"🧠 Initializing Word2Vec model with vector_size=50, window=5", flush=True)
            model = Word2Vec(sentences=training_data, vector_size=50, window=5, min_count=1, workers=4, epochs=50)
            print("✅ Word2Vec model trained successfully!", flush=True)
            
            # Save model to MongoDB
            try:
                print("💾 Serializing model for MongoDB storage", flush=True)
                model_bytes = pickle.dumps(model)
                model_id = fs.put(model_bytes, filename="word2vec_model", metadata={"date": datetime.now()})
                print(f"💾 Saved Word2Vec model to MongoDB with ID: {model_id}", flush=True)
            except Exception as e:
                print(f"❌ Error saving model to MongoDB: {e}", flush=True)
        except Exception as e:
            print(f"❌ Error training Word2Vec model: {e}", flush=True)
            model = None
    else:
        print("⚠️ No training data available for model training!", flush=True)
        model = None

# Schedule the matching task to run every hour
print("📅 Setting up scheduled matching to run hourly", flush=True)
scheduler = BackgroundScheduler()
scheduler.add_job(
    schedule_daily_matching, 
    'interval', 
    hours=1,
    id="matching_scheduler",
    next_run_time=datetime.now(),  # Run once immediately on startup
    max_instances=1  # Ensure only one instance runs at a time
)

# Log when the next run will occur
next_run = scheduler.get_job("matching_scheduler").next_run_time
print(f"⏰ Next scheduled matching will run at: {next_run.strftime('%Y-%m-%d %H:%M:%S')}", flush=True)

scheduler.start()
print("✅ Background scheduler started", flush=True)

@app.route("/admin/stats", methods=["GET"])
def admin_stats():
    """Get statistics about the stored data in MongoDB collections."""
    stats = {
        "user_embeddings_count": user_embeddings_collection.count_documents({}),
        "tier_lists_count": tier_lists_collection.count_documents({}),
        "matches_count": matches_collection.count_documents({}),
        "model_files_count": db.fs.files.count_documents({"filename": "word2vec_model"}),
        "in_memory": {
            "embeddings_count": len(user_embeddings),
            "tier_lists_count": len(user_tier_lists),
            "matches_count": len(daily_matches),
            "model_loaded": model is not None
        }
    }
    return jsonify(stats)

@app.route("/admin/clear_data", methods=["POST"])
def admin_clear_data():
    """Clear all stored data (for testing/reset purposes)."""
    global user_embeddings, user_tier_lists, daily_matches, model
    
    data = request.json or {}
    clear_embeddings = data.get("clear_embeddings", True)
    clear_tier_lists = data.get("clear_tier_lists", True)
    clear_matches = data.get("clear_matches", True)
    clear_model = data.get("clear_model", True)
    
    if clear_embeddings:
        user_embeddings_collection.delete_many({})
        user_embeddings = {}
    
    if clear_tier_lists:
        tier_lists_collection.delete_many({})
        user_tier_lists = []
    
    if clear_matches:
        matches_collection.delete_many({})
        daily_matches = {}
    
    if clear_model:
        for model_file in db.fs.files.find({"filename": "word2vec_model"}):
            fs.delete(model_file["_id"])
        model = None
    
    return jsonify({
        "message": "Data cleared successfully",
        "cleared": {
            "embeddings": clear_embeddings,
            "tier_lists": clear_tier_lists,
            "matches": clear_matches,
            "model": clear_model
        }
    })

@app.route("/admin/retrain_model", methods=["POST"])
def admin_retrain_model():
    """Force retrain the model with existing tier lists."""
    global model
    
    # Set model to None to force retraining
    model = None
    
    # Train model
    train_model()
    
    if model is not None:
        return jsonify({"message": "Model retrained successfully"})
    else:
        return jsonify({"error": "Failed to retrain model"}), 500

@app.route("/get_tier_list/<user_id>", methods=["GET"])
def get_tier_list(user_id):
    """Retrieves a user's tier list if available."""
    
    # Find tier list in MongoDB
    tier_list_doc = tier_lists_collection.find_one({"user_id": user_id})
    
    if tier_list_doc and "tier_list" in tier_list_doc:
        return jsonify({
            "user_id": user_id,
            "tier_list": tier_list_doc["tier_list"],
            "timestamp": tier_list_doc.get("timestamp", datetime.now()).isoformat()
        })
    else:
        return jsonify({"error": "Tier list not found for user"}), 404

@app.route("/test_compatibility", methods=["POST"])
def test_compatibility():
    """Test endpoint to check compatibility between two users."""
    data = request.json
    user1_id = data.get("user1_id")
    user2_id = data.get("user2_id")
    
    if not user1_id or not user2_id:
        return jsonify({"error": "Missing user IDs"}), 400
    
    user1_info = get_user_info(user1_id)
    user2_info = get_user_info(user2_id)
    
    if not user1_info or not user2_info:
        return jsonify({"error": "One or both users not found"}), 404
    
    # Check compatibility
    compatible = is_match_compatible(
        user1_info.get("sex"), 
        user1_info.get("lookingFor"),
        user2_info.get("sex"),
        user2_info.get("lookingFor")
    )
    
    return jsonify({
        "compatible": compatible,
        "user1": {
            "id": user1_id,
            "gender": user1_info.get("sex"),
            "lookingFor": user1_info.get("lookingFor")
        },
        "user2": {
            "id": user2_id,
            "gender": user2_info.get("sex"),
            "lookingFor": user2_info.get("lookingFor")
        }
    })

@app.route("/admin/rabbitmq_status", methods=["GET"])
def rabbitmq_status():
    """Check RabbitMQ connection status."""
    connection_status = {
        "is_connected": rabbitmq_connection.is_connected,
        "heartbeat_running": rabbitmq_connection.heartbeat_thread is not None and rabbitmq_connection.heartbeat_thread.is_alive(),
        "timestamp": datetime.now().isoformat()
    }
    
    # Add queue info if connected
    if rabbitmq_connection.is_connected:
        queue_info = rabbitmq_connection.get_queue_info()
        connection_status["queues"] = queue_info
        
    return jsonify(connection_status)

@app.route("/admin/reconnect_rabbitmq", methods=["POST"])
def reconnect_rabbitmq():
    """Force reconnection to RabbitMQ."""
    # Close existing connection if any
    rabbitmq_connection.close_connection()
    
    # Attempt to reconnect
    success = rabbitmq_connection.connect()
    
    if success:
        return jsonify({
            "message": "RabbitMQ connection reestablished successfully",
            "timestamp": datetime.now().isoformat()
        })
    else:
        return jsonify({
            "error": "Failed to reconnect to RabbitMQ",
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route("/admin/purge_rabbitmq_queues", methods=["POST"])
def purge_rabbitmq_queues():
    """Purge all messages from RabbitMQ queues."""
    result = rabbitmq_connection.purge_queues()
    
    if "error" in result:
        return jsonify({
            "error": result["error"],
            "timestamp": datetime.now().isoformat()
        }), 500
    
    return jsonify({
        "message": "Successfully purged all RabbitMQ queues",
        "timestamp": datetime.now().isoformat()
    })

@app.route("/admin/test_rabbitmq", methods=["POST"])
def test_rabbitmq():
    """Send a test message to RabbitMQ."""
    test_user_id = request.json.get("user_id", "test_user")
    test_match_id = request.json.get("match_id", "test_match")
    
    success = rabbitmq_connection.send_match(test_user_id, test_match_id)
    
    if success:
        return jsonify({
            "message": f"Test message sent successfully: {test_user_id} -> {test_match_id}",
            "timestamp": datetime.now().isoformat()
        })
    else:
        return jsonify({
            "error": "Failed to send test message",
            "timestamp": datetime.now().isoformat()
        }), 500

if __name__ == "__main__":
    # Print startup information
    print(f"🚀 Starting ML service at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", flush=True)
    print(f"⚙️ Configuration: PORT={os.getenv('PORT', 8086)}", flush=True)
    print(f"💾 MongoDB: {MONGO_HOST}:{MONGO_PORT}, DB={MONGO_DB}", flush=True)
    print(f"🐇 RabbitMQ: {os.getenv('RABBITMQ_HOST')}:{os.getenv('RABBITMQ_PORT')}", flush=True)
    
    port = int(os.getenv("PORT", 8086))
    app.run(host="0.0.0.0", port=port)
    
    # Shutdown procedures
    print("🛑 Shutting down ML service...", flush=True)
    scheduler.shutdown()
    print("🛑 Background scheduler stopped", flush=True)
    
    # Close RabbitMQ connection when the app exits
    rabbitmq_connection.close_connection()
