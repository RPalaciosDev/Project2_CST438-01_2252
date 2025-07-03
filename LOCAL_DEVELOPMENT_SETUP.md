# Local Development Setup Guide

This guide will help you set up the LoveTiers project to run locally, fixing the port configuration issues that prevent local development.

## Prerequisites

- Java 17 JDK
- Node.js (v18 or later)
- Python 3.9+ (for ML service)
- MongoDB (local or Docker)
- Git

## Port Configuration

The project has been configured to use the following ports for local development:

| Service | Port | Description |
|---------|------|-------------|
| Auth Service | 8081 | User authentication and management |
| Tier List Service | 8082 | Tier list CRUD operations |
| Chat Service | 8083 | Real-time messaging |
| Image Storage Service | 8084 | Image handling and storage |
| ML Service | 8086 | Machine learning recommendations |
| Frontend | 19006 | Expo React Native app |

## Environment Variables

Create a `.env` file in each service directory with the following variables:

### Auth Service (auth_user_api/.env)
```bash
SERVER_PORT=8081
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DATABASE=auth_service
MONGODB_USERNAME=root
MONGODB_PASSWORD=example
JWT_SECRET=your-secure-jwt-secret-for-local-development
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
ALLOWED_ORIGINS=http://localhost:19006,http://localhost:3000,http://localhost:19000
FRONTEND_URL=http://localhost:19006
```

### Tier List Service (tier-list-service/.env)
```bash
SERVER_PORT=8082
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DATABASE=tierlist_db
MONGODB_USERNAME=root
MONGODB_PASSWORD=example
IMAGE_SERVICE_URL=http://localhost:8084
ALLOWED_ORIGINS=http://localhost:19006,http://localhost:3000,http://localhost:19000
```

### Chat Service (chat_api/.env)
```bash
SERVER_PORT=8083
CASSANDRA_HOST=localhost
CASSANDRA_PORT=9042
CASSANDRA_KEYSPACE=chat_keyspace
CASSANDRA_USERNAME=
CASSANDRA_PASSWORD=
CASSANDRA_DATACENTER=datacenter1
ALLOWED_ORIGINS=http://localhost:19006,http://localhost:3000,http://localhost:19000
```

### Image Storage Service (image-storage-service/.env)
```bash
SERVER_PORT=8084
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DATABASE=image_storage
MONGODB_USERNAME=root
MONGODB_PASSWORD=example
AWS_S3_REGION=us-east-2
AWS_S3_BUCKET=strawhat-tierlist-images
AWS_ACCESS_KEY=your-aws-access-key
AWS_SECRET_KEY=your-aws-secret-key
ALLOWED_ORIGINS=http://localhost:19006,http://localhost:3000,http://localhost:19000
```

### ML Service (ml-service/.env)
```bash
PORT=8086
MONGO_HOST=localhost
MONGO_PORT=27017
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=password
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=guest
RABBITMQ_PASSWORD=guest
```

### Frontend (frontend/.env)
```bash
EXPO_PUBLIC_API_URL=http://localhost:8081
EXPO_PUBLIC_TIERLIST_API_URL=http://localhost:8082
EXPO_PUBLIC_CHAT_API_URL=http://localhost:8083
EXPO_PUBLIC_IMAGE_API_URL=http://localhost:8084
EXPO_PUBLIC_ML_API_URL=http://localhost:8086
EXPO_PUBLIC_OAUTH_REDIRECT_URI=http://localhost:8081/login/oauth2/code/google
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

## Database Setup

### MongoDB Setup
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=example \
  mongo:latest

# Or using MongoDB locally
# Install MongoDB and start the service
```

### Cassandra Setup (for Chat Service)
```bash
# Using Docker
docker run -d -p 9042:9042 --name cassandra \
  -e CASSANDRA_CLUSTER_NAME=chat_cluster \
  cassandra:latest

# Wait for Cassandra to start, then create keyspace
docker exec -it cassandra cqlsh -e "CREATE KEYSPACE IF NOT EXISTS chat_keyspace WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};"
```

## Running Services Locally

### 1. Start Backend Services

**Auth Service:**
```bash
cd auth_user_api
./gradlew bootRun
```

**Tier List Service:**
```bash
cd tier-list-service
./gradlew bootRun
```

**Chat Service:**
```bash
cd chat_api
./gradlew bootRun
```

**Image Storage Service:**
```bash
cd image-storage-service
./gradlew bootRun
```

**ML Service:**
```bash
cd ml-service
python app.py
```

### 2. Start Frontend

```bash
cd frontend
npm install
npx expo start
```

## Verification

Check that all services are running on the correct ports:

```bash
# Check if services are responding
curl http://localhost:8081/actuator/health  # Auth Service
curl http://localhost:8082/actuator/health  # Tier List Service
curl http://localhost:8083/actuator/health  # Chat Service
curl http://localhost:8084/actuator/health  # Image Storage Service
curl http://localhost:8086/health           # ML Service
```

## Troubleshooting

### Port Already in Use
If you get "port already in use" errors:

```bash
# Find processes using the port
lsof -i :8081
lsof -i :8082
lsof -i :8083
lsof -i :8084
lsof -i :8086

# Kill the process
kill -9 <PID>
```

### CORS Issues
If you encounter CORS errors, ensure the `ALLOWED_ORIGINS` environment variable includes your frontend URL.

### Database Connection Issues
- Verify MongoDB is running: `docker ps` or `brew services list | grep mongodb`
- Check connection strings in environment variables
- Ensure database credentials are correct

### OAuth Issues
- Set up Google OAuth credentials for local development
- Add `http://localhost:8081/login/oauth2/code/google` to authorized redirect URIs
- Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in auth service

## Development Workflow

1. Start databases (MongoDB, Cassandra)
2. Start backend services in separate terminals
3. Start frontend with `npx expo start`
4. Access the app at `http://localhost:19006`

## Notes

- The Dockerfiles are configured for Railway deployment and use port 8080
- For local development, use the application.yml files that set the correct ports
- Environment variables override the default configurations
- All services now have consistent CORS configurations for local development 