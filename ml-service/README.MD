# ML Service README

## Overview
This is a Flask-based machine learning service for processing and comparing tier lists in a tier-list-based dating app. The service receives user tier lists, computes similarity scores using machine learning, and returns the most similar users.

## Project Structure
```
ml-service/
│── app.py                 # Flask API entry point
│── requirements.txt       # Python dependencies
│── model/                 # ML model (demonstration version, not final)
│── README.md              # Project documentation
```

## Setup & Installation
### Prerequisites
Ensure you have Python 3.8+ installed.

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
The service will run at `http://localhost:5000`.

## API Endpoints
### 1. Compare Tier Lists
**Endpoint:** `/compare_tiers`  
**Method:** `POST`  
**Request Body:**
```json
{
  "user_id": "user1",
  "vector": [0.2, 0.8, 0.5]
}
```
**Response:**
```json
{
  "matches": [
    ["user2", 0.89],
    ["user3", 0.76]
  ]
}
```

## Deployment
### Deploy to Railway
1. Initialize Railway project
```bash
railway init
```
2. Deploy the service
```bash
railway up
```

## Future Improvements
- Implement the final ML model
- Optimize performance with precomputed embeddings
- Deploy to AWS Lambda for serverless processing

## License
This project is licensed under the MIT License.

