# ML Service

A machine learning microservice for user matching and recommendation in the LoveTiers application.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Matching Algorithm](#matching-algorithm)
- [API Endpoints](#api-endpoints)
- [Integration with Other Services](#integration-with-other-services)
- [Setup and Installation](#setup-and-installation)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Features

- **Machine Learning-Based Matching**
  - User similarity calculation based on tier list preferences
  - Agglomerative clustering for grouping compatible users
  - Word2Vec embeddings to capture semantic relationships between rankings

- **Real-time and Scheduled Matching**
  - Daily automated matching process
  - On-demand matching capabilities
  - Persistent storage of match results

- **Cross-Service Communication**
  - RabbitMQ integration for asynchronous notifications
  - MongoDB integration for user data retrieval
  - RESTful API for frontend and service communication

- **Compatibility Filtering**
  - Gender and preference-based filtering
  - Age and other demographic considerations
  - Multi-dimensional similarity metrics

- **Test Data Generation**
  - Automatic creation of test tier lists
  - Simulation capabilities for testing
  - Debugging and performance analysis tools

## Tech Stack

- **Core**: Flask, Python 3.9+
- **Machine Learning**: scikit-learn, Gensim (Word2Vec)
- **Database**: MongoDB for user data
- **Messaging**: RabbitMQ for match notifications
- **Scheduling**: APScheduler for automated matching
- **Deployment**: Docker, Railway

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │     │   Auth User     │     │   Tier List     │
│   Application   │     │     Service     │     │     Service     │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────┬───────────┴───────────┬───────────┘
                     │                       │
           ┌─────────▼─────────┐   ┌─────────▼─────────┐
           │     ML Service    │◄──┤     RabbitMQ      │
           │                   │   │     Message Bus    │
           └─────────┬─────────┘   └───────────────────┘
                     │
                     ▼
           ┌───────────────────┐
           │     MongoDB       │
           │     Database      │
           └───────────────────┘
```

### Core Components

1. **Machine Learning Module**
   - `Word2Vec Model`: Processes tier list preferences into vector representations
   - `Agglomerative Clustering`: Groups users based on similarity
   - `Embedding Generation`: Creates user preference vectors

2. **API Layer**
   - `Flask Application`: Exposes endpoints for tier list submission and match retrieval
   - `CORS Configuration`: Enables cross-origin access from frontend

3. **Integration Layer**
   - `RabbitMQ Connection`: Publishes match data to message queue
   - `MongoDB Client`: Retrieves user data for compatibility checks

4. **Scheduling System**
   - `BackgroundScheduler`: Manages recurring matching processes
   - `On-Demand Processing`: Handles manual match triggering

## Matching Algorithm

The ML Service employs a sophisticated matching algorithm based on the following steps:

### 1. Tier List Processing

- Users submit tier lists ranking characters in categories S through F
- Each tier is weighted (S=6, A=5, B=4, C=3, D=2, E=1, F=0)
- Characters are represented as tokens for Word2Vec processing

### 2. Embedding Generation

```
def get_user_embedding(user_tier_list):
    weighted_vectors = []
    for image, tier in user_tier_list.items():
        if image in model.wv:
            weighted_vectors.append(model.wv[image] * tier_weights[tier])
    return np.mean(weighted_vectors, axis=0)
```

### 3. Agglomerative Clustering

- Users are grouped into clusters based on embedding similarity
- Hierarchical clustering with a 1.0 distance threshold
- Ward linkage method for minimizing variance within clusters

### 4. Compatibility Filtering

- Users in the same cluster are evaluated for gender compatibility
- Filter based on gender preference (male, female, both)
- Additional filters like age can be applied

### 5. Match Ranking

- Final matches are ranked by similarity within compatible users
- Euclidean distance and cosine similarity metrics
- Top matches are stored and delivered to users

## API Endpoints

### Tier List Submission

- **Endpoint**: `/submit_tier_list`
- **Method**: `POST`
- **Description**: Receives a user's tier list and processes it for matching
- **Request Body**:

```json
{
    "user_id": "user123",
  "tier_list": {
    "Monkey_D_Luffy": "S",
    "Roronoa_Zoro": "A",
    "Sanji": "B",
    "Nami": "C"
  }
}
```

- **Response**:

```json
{
  "message": "Tier list submitted successfully!",
    "user_id": "user123"
  }
  ```

### Get Matches

- **Endpoint**: `/get_matches`
- **Method**: `GET`
- **Description**: Retrieves the latest matching results for all users
- **Response**:

```json
{
    "daily_matches": {
      "user123": ["user456", "user789", "user101"]
    }
  }
  ```

### Trigger Matching

- **Endpoint**: `/run_matching_now`
- **Method**: `POST`
- **Description**: Manually triggers the matching algorithm
- **Response**:

  ```json
  {
    "message": "Daily matching process triggered successfully!"
  }
  ```

### Generate Test Data

- **Endpoint**: `/generate_test_tier_lists`
- **Method**: `POST`
- **Description**: Creates test tier lists for development purposes
- **Response**:

  ```json
  {
    "message": "Test tier lists generated and submitted!"
  }
  ```

### Service Status

- **Endpoint**: `/`
- **Method**: `GET`
- **Description**: Provides service health status
- **Response**:

  ```json
  {
    "message": "Flask API is running with scheduled matching!"
  }
  ```

## Integration with Other Services

### Auth User Service

- Retrieves user demographic data for compatibility checking
- Uses MongoDB to access user profiles
- Fetches gender, preferences, and other matching criteria

```python
def get_user_info(user_id):
    query = {"_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"username": user_id}
    user = users_collection.find_one(query)
    if user:
        return {
            "sex": user.get("gender", "unknown"),
            "lookingFor": user.get("lookingFor", "both"),
            "username": user.get("username"),
            "email": user.get("email"),
            "age": user.get("age"),
        }
    return None
```

### RabbitMQ Integration

- Publishes match results to message queue
- Notifies other services about new matches
- Enables asynchronous processing

```python
rabbitmq_connection = RabbitMQConnection(
    host=os.getenv("RABBITMQ_HOST"),
    port=int(os.getenv("RABBITMQ_PORT")), 
    username=os.getenv("RABBITMQ_USERNAME"),
    password=os.getenv("RABBITMQ_PASSWORD")
)

# Sending match data
rabbitmq_connection.send_match(user_id, match_id)
```

### Frontend Integration

- Provides RESTful API for tier list submission
- Delivers match results to the frontend application
- Supports CORS for secure cross-origin requests

## Setup and Installation

### Prerequisites

- Python 3.9 or higher
- MongoDB instance
- RabbitMQ server
- Docker (optional, for containerized deployment)

### Local Development Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ml-service
   ```

2. **Create a virtual environment**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   Create a `.env` file with the following variables:

   ```
   # MongoDB Configuration
   MONGO_INITDB_ROOT_USERNAME=admin
   MONGO_INITDB_ROOT_PASSWORD=password
   MONGO_HOST=localhost
   MONGO_PORT=27017
   
   # RabbitMQ Configuration
   RABBITMQ_HOST=localhost
   RABBITMQ_PORT=5672
   RABBITMQ_USERNAME=guest
   RABBITMQ_PASSWORD=guest
   
   # Application Settings
   PORT=8086
   ```

5. **Run the application**

   ```bash
   python app.py
   ```

### Using Docker

```bash
# Build the Docker image
docker build -t ml-service .

# Run the container
docker run -p 8086:8086 --env-file .env ml-service
```

## Deployment

### Railway Deployment

The ML Service is configured for deployment on Railway:

1. Make sure your code is committed to a Git repository
2. Connect the repository to Railway
3. Configure the necessary environment variables in Railway
4. Deploy the service

## Troubleshooting

### Common Issues

#### Word2Vec Model Not Training

- Check if enough tier lists have been submitted
- Verify training data is not empty
- Ensure the model has enough data to learn embeddings

#### No Matches Being Found

- Verify user embeddings are being generated correctly
- Check if compatibility filtering is too restrictive
- Ensure enough users have submitted tier lists

#### RabbitMQ Connection Issues

- Verify RabbitMQ server is running
- Check connection credentials
- Ensure proper queue declaration

#### MongoDB Connection Problems

- Validate MongoDB connection string
- Verify user credentials
- Check network connectivity to MongoDB instance

### Logs and Debugging

The ML Service includes comprehensive logging for debugging:

```bash
# View logs in Docker
docker logs -f ml-service-container

# View logs in Railway
railway logs
```

## Development and Testing

### Adding New Features

To extend the matching algorithm:

1. Add new features to the user embedding generation
2. Update compatibility checks as needed
3. Add new metrics for match scoring

### Testing the Matching Algorithm

Use the test data generation endpoint:

```bash
curl -X POST http://localhost:8086/generate_test_tier_lists
```

This will create test tier lists and trigger the matching process for evaluation.
