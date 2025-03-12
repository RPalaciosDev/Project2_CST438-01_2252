# Auth User API

This service provides authentication and user management functionality using OAuth2 with Google and JWT tokens.

## Features

- Google OAuth2 Authentication
- JWT Token Generation
- User Management
- Secure API Endpoints

## Technology Stack

- Java 17
- Spring Boot
- Spring Security with OAuth2
- MongoDB
- JWT Authentication

## Deployment on Railway

### Prerequisites

1. A Railway account (https://railway.app/)
2. MongoDB instance (can be created on Railway or use MongoDB Atlas)
3. Google OAuth2 credentials (Client ID and Client Secret)

### Environment Variables

Set the following environment variables in Railway:

```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
MONGODB_URI=mongodb://username:password@host:port/database
JWT_SECRET=your-secure-random-jwt-secret
FRONTEND_URL=https://your-frontend-url.com
ALLOWED_ORIGINS=https://your-frontend-url.com,https://another-allowed-origin.com
SPRING_PROFILES_ACTIVE=prod
```

### Deployment Steps

1. Create a new project in Railway
2. Link your GitHub repository or use the Railway CLI to deploy
3. Add the MongoDB service or link to an external MongoDB
4. Set the required environment variables
5. Deploy the service

Railway will automatically detect the Dockerfile and build/deploy your service.

## Local Development

### Running Locally

1. Clone the repository
2. Set up environment variables (in application.yml or as system environment variables)
3. Run the application using:

```bash
./gradlew bootRun
```

## API Endpoints

- `GET /` - Home, returns service status
- `GET /welcome` - Welcome page, accessible without authentication
- `GET /api/user/me` - Get current user information (requires authentication)
- `GET /api/user/all` - Get all users (requires authentication) 