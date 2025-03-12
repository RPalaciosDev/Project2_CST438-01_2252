from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
CORS(app)

# Store embeddings (temporary storage for testing)
user_embeddings = {}

@app.route("/compare_tiers", methods=["POST"])
def compare_tiers():
    data = request.json
    user_id = data.get("user_id")
    tier_list_vector = np.array(data.get("vector"))

    # Save user vector
    if user_id not in user_embeddings:
        user_embeddings[user_id] = tier_list_vector

    # Compute similarity
    similarities = {
        uid: float(cosine_similarity([tier_list_vector], [vec])[0][0])
        for uid, vec in user_embeddings.items() if uid != user_id
    }

    sorted_matches = sorted(similarities.items(), key=lambda x: x[1], reverse=True)[:5]
    return jsonify({"matches": sorted_matches})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
