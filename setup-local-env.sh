#!/bin/bash

# Local Development Environment Variables
export MONGO_INITDB_ROOT_USERNAME=root
export MONGO_INITDB_ROOT_PASSWORD=example
export MONGO_HOST=localhost
export MONGO_PORT=27017
export MONGO_DB=auth_db

# JWT Configuration
export JWT_SECRET=your-very-long-secret-key-should-be-kept-safe-for-local-development
export JWT_EXPIRATION=86400000

# Service Ports
export SERVER_PORT=8081

# Frontend URL
export FRONTEND_URL=http://localhost:3000

# Image Storage Service
export IMAGE_STORAGE_URL=http://localhost:8084

echo "✅ Local environment variables set up successfully!"
echo "📋 Available variables:"
echo "   - MONGO_INITDB_ROOT_USERNAME: $MONGO_INITDB_ROOT_USERNAME"
echo "   - MONGO_HOST: $MONGO_HOST"
echo "   - MONGO_PORT: $MONGO_PORT"
echo "   - MONGO_DB: $MONGO_DB"
echo "   - SERVER_PORT: $SERVER_PORT"
echo ""
echo "🚀 To start services, run:"
echo "   source setup-local-env.sh"
echo "   cd auth_user_api && ./gradlew bootRun"
echo "   cd tier-list-service && ./gradlew bootRun"
echo "   cd image-storage-service && ./gradlew bootRun" 