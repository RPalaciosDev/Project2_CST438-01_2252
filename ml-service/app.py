from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# In-memory storage for local development
user_tier_lists = {}
user_embeddings = {}
matches = {}

def get_user_embedding(tier_list):
    """Create a simple embedding based on tier weights"""
    if not tier_list or not tier_list.get('tiers'):
        return np.zeros(10)
    
    # Simple embedding: count items in each tier
    embedding = np.zeros(10)
    tiers = tier_list['tiers']
    
    for tier_name, items in tiers.items():
        if items:
            # Assign weight based on tier position (S tier = highest weight)
            tier_weight = 1.0
            if tier_name.upper() == 'S':
                tier_weight = 10.0
            elif tier_name.upper() == 'A':
                tier_weight = 8.0
            elif tier_name.upper() == 'B':
                tier_weight = 6.0
            elif tier_name.upper() == 'C':
                tier_weight = 4.0
            elif tier_name.upper() == 'D':
                tier_weight = 2.0
            elif tier_name.upper() == 'F':
                tier_weight = 1.0
            
            embedding[len(items)] = tier_weight
    
    return embedding

def cosine_similarity(a, b):
    """Calculate cosine similarity between two vectors"""
    dot_product = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    
    if norm_a == 0 or norm_b == 0:
        return 0
    
    return dot_product / (norm_a * norm_b)

def find_top_matches(user_id, top_k=5):
    """Find top matches for a user based on tier list similarity"""
    if user_id not in user_embeddings:
        return []
    
    user_embedding = user_embeddings[user_id]
    similarities = []
    
    for other_user_id, other_embedding in user_embeddings.items():
        if other_user_id != user_id:
            similarity = cosine_similarity(user_embedding, other_embedding)
            similarities.append({
                'user_id': other_user_id,
                'similarity': float(similarity)
            })
    
    # Sort by similarity and return top matches
    similarities.sort(key=lambda x: x['similarity'], reverse=True)
    return similarities[:top_k]

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'UP',
        'service': 'ML Service',
        'version': '1.0.0'
    })

@app.route('/match', methods=['POST'])
def match_users():
    """Match users based on tier list similarity"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        tier_list = data.get('tier_list')
        
        if not user_id or not tier_list:
            return jsonify({'error': 'Missing user_id or tier_list'}), 400
        
        # Store user's tier list
        user_tier_lists[user_id] = tier_list
        
        # Create embedding for the user
        embedding = get_user_embedding(tier_list)
        user_embeddings[user_id] = embedding
        
        # Find matches
        matches_list = find_top_matches(user_id)
        
        # Store matches
        matches[user_id] = matches_list
        
        return jsonify({
            'user_id': user_id,
            'matches': matches_list,
            'message': 'Matches found successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/matches/<user_id>', methods=['GET'])
def get_matches(user_id):
    """Get matches for a specific user"""
    try:
        if user_id not in matches:
            return jsonify({'error': 'No matches found for this user'}), 404
        
        return jsonify({
            'user_id': user_id,
            'matches': matches[user_id]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/users/<user_id>/tierlist', methods=['GET'])
def get_user_tierlist(user_id):
    """Get tier list for a specific user"""
    try:
        if user_id not in user_tier_lists:
            return jsonify({'error': 'No tier list found for this user'}), 404
        
        return jsonify({
            'user_id': user_id,
            'tier_list': user_tier_lists[user_id]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/users/<user_id>/embedding', methods=['GET'])
def get_user_embedding_endpoint(user_id):
    """Get embedding for a specific user"""
    try:
        if user_id not in user_embeddings:
            return jsonify({'error': 'No embedding found for this user'}), 404
        
        return jsonify({
            'user_id': user_id,
            'embedding': user_embeddings[user_id].tolist()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8086))
    app.run(host='0.0.0.0', port=port, debug=True)
