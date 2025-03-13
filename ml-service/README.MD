# ML Service README

## Overview
This is a Flask-based machine learning service for processing and comparing tier lists in a tier-list-based dating app. The service receives user tier lists, clusters them using Agglomerative Clustering, computes similarity scores, and returns the most similar users.

## Project Structure
```
ml-service/
│── app.py                 # Flask API entry point
│── requirements.txt       # Python dependencies
│── Dockerfile             # Containerization setup for deployment
│── README.md              # Project documentation
```

## Setup & Installation
### Prerequisites
Ensure you have Python 3.9+ installed.

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ml-service
```

### 2. Create a Virtual Environment (Recommended)
```bash
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

## Running the Service
To start the Flask API:
```bash
python app.py
```
The service will run at `http://localhost:8086`.

## API Endpoints
### 1. Submit a Tier List
**Endpoint:** `/submit_tier_list`  
**Method:** `POST`  
**Request Body:**
```json
{
  "user_id": "user1",
  "tier_list": {
    "Monkey_D_Luffy": "S",
    "Roronoa_Zoro": "A",
    "Sanji": "B",
    "Nami": "C"
  }
}
```
**Response:**
```json
{
  "message": "Tier list submitted successfully!",
  "user_id": "user1"
}
```

### 2. Get User Matches
**Endpoint:** `/get_matches/<user_id>`  
**Method:** `GET`  
**Response:**
```json
{
  "user_id": "user1",
  "matches": [
    {
      "user_id": "user2",
      "euclidean_distance": 0.0336,
      "cosine_similarity": 0.9712
    }
  ]
}
```

## Deployment
### Deploy to Railway
1. Ensure Docker is installed.
2. Push code to GitHub and deploy via Railway:
```bash
git add .
git commit -m "Deploy Flask API with clustering"
git push origin main
```
3. Deploy the service
```bash
railway up
```

## Future Improvements
- Implement a persistent database for storing tier lists.
- Optimize performance with precomputed embeddings.
- Deploy to AWS Lambda for serverless processing.
- Improve clustering accuracy with advanced machine learning techniques.

## License
This project is licensed under the MIT License.

