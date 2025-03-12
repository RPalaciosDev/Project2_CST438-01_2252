import numpy as np
import random
import json
from gensim.models import Word2Vec
from sklearn.cluster import AgglomerativeClustering
from sklearn.metrics.pairwise import cosine_similarity
from scipy.spatial.distance import euclidean

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

# Define tier categories
tiers = ["S", "A", "B", "C", "D", "E", "F"]

# Generate 10 random tier lists as Word2Vec training data
num_users = 10
user_tier_lists = []
training_data = []

for user_id in range(1, num_users + 1):
    shuffled_images = images.copy()
    random.shuffle(shuffled_images)  # Shuffle images randomly
    
    # Assign tiers to images
    assigned_tiers = {image: random.choice(tiers) for image in shuffled_images}
    
    # Convert tier list into a Word2Vec-friendly format
    tiered_ranking = [[image for image, tier in assigned_tiers.items() if tier == t] for t in tiers]
    tiered_ranking = [group for group in tiered_ranking if group]  # Remove empty tiers
    training_data.extend(tiered_ranking)  # Add to Word2Vec dataset
    
    # Store user data
    user_tier_lists.append({
        "user_id": user_id,
        "tier_list": assigned_tiers
    })

# Train a Word2Vec model with more epochs for better differentiation
model = Word2Vec(sentences=training_data, vector_size=50, window=5, min_count=1, workers=4, epochs=50)

# Generate user embeddings with weighted tiers
def get_user_embedding(user_tier_list):
    """Compute the average embedding of a user's ranked tier list, giving more weight to higher tiers."""
    weighted_vectors = []
    tier_weights = {"S": 6, "A": 5, "B": 4, "C": 3, "D": 2, "E": 1, "F": 0}  # Higher weight for better tiers
    
    for image, tier in user_tier_list.items():
        if image in model.wv:
            weighted_vectors.append(model.wv[image] * tier_weights[tier])

    return np.mean(weighted_vectors, axis=0) if weighted_vectors else np.zeros(model.vector_size)

user_embeddings = {
    user["user_id"]: get_user_embedding(user["tier_list"]) for user in user_tier_lists
}

# Convert embeddings to NumPy array for clustering
user_ids = list(user_embeddings.keys())
embeddings_matrix = np.array([user_embeddings[user_id] for user_id in user_ids])

# Print embeddings to check uniqueness
for user_id, embedding in user_embeddings.items():
    print(f"User {user_id} Embedding: {embedding[:5]}...")  # Print first 5 values for brevity

# Perform Agglomerative Clustering
clustering = AgglomerativeClustering(n_clusters=None, distance_threshold=1.5, linkage='ward')
cluster_labels = clustering.fit_predict(embeddings_matrix)

# Compute full cosine similarity matrix to verify differences
similarity_matrix = cosine_similarity(embeddings_matrix)
print("Cosine Similarity Matrix:")
print(similarity_matrix)

# Find top 5 closest matches for each user
def find_top_matches(user_id, user_embeddings, top_n=5):
    distances = []
    similarities = []
    for other_id in user_embeddings:
        if user_id != other_id:
            dist = euclidean(user_embeddings[user_id], user_embeddings[other_id])
            sim = cosine_similarity([user_embeddings[user_id]], [user_embeddings[other_id]])[0][0]
            distances.append((other_id, dist, sim))
    distances.sort(key=lambda x: x[1])  # Sort by Euclidean distance (ascending)
    return [(match[0], match[1], match[2]) for match in distances[:top_n]]

user_matches = {user_id: find_top_matches(user_id, user_embeddings) for user_id in user_ids}

# Print user tier lists and their top 5 matches with similarity scores
for user in user_tier_lists:
    user_id = user["user_id"]
    print(f"User {user_id}'s Tier List:")
    for tier, members in user["tier_list"].items():
        print(f"  {tier}: {members}")
    print(f"Top 5 Matches:")
    for match_id, euclidean_dist, cosine_sim in user_matches[user_id]:
        print(f"  User {match_id}: Euclidean Distance = {euclidean_dist:.4f}, Cosine Similarity = {cosine_sim:.4f}")
    print("-" * 40)

print("User tier lists, embeddings, and top 5 matches generated using Agglomerative Clustering!")

