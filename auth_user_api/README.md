# Auth User API

This service provides authentication, user management, and tag statistics functionality using OAuth2 with Google and JWT tokens.

## Features

- Google OAuth2 Authentication
- JWT Token Generation and Validation
- User Management with Profile Settings
- Tag Statistics Tracking System
- Secure API Endpoints with Role-Based Access
- CORS Configuration for Frontend Integration

## Technology Stack

- Java 17
- Spring Boot 3.x
- Spring Security with OAuth2 Resource Server
- MongoDB for User Data and Tag Statistics
- JWT Authentication

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/signin` - Sign in with username/password
- `GET /api/auth/me` - Get current authenticated user info
- `GET /oauth2/authorization/google` - Start Google OAuth flow
- `GET /login/oauth2/code/google` - OAuth2 callback endpoint

### User Management

- `GET /api/user/me` - Get current user information (requires authentication)
- `GET /api/user/all` - Get all users (requires admin role)
- `PUT /api/user/{userId}` - Update user profile information
- `GET /api/user/{userId}` - Get user by ID

### Tag Statistics System

- `POST /api/user/tags/record/{userId}` - Record tags from a tier list submission
- `GET /api/user/tags/{userId}` - Get all tag statistics for a user
- `GET /api/user/tags/top/{userId}` - Get top tags for a user (with optional limit parameter)

### System Health & Status

- `GET /actuator/health` - Service health check
- `GET /api/health/check` - Detailed health status information
- `GET /api/health/debug` - Debug information for troubleshooting

## Tag Statistics System

The tag statistics system tracks user interactions with different tags to provide personalized recommendations and insights:

### Features

- Records tags from tier list submissions
- Maintains count of tag occurrences per user
- Tracks total number of tier lists submitted
- Provides API to retrieve top tags for personalization

### Data Model

The `UserTagStats` document stored in MongoDB contains:

- User ID as the primary key
- Map of tag names to occurrence counts
- Total tier lists submitted count
- Last updated timestamp

### Integration

The tag system integrates with:

1. Frontend tier list submission process
2. ML Service for recommendation generation
3. Image Storage Service for tag extraction

## Deployment on Railway

### Prerequisites

1. A Railway account (<https://railway.app/>)
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

### Prerequisites

1. Java 17 JDK
2. Docker (optional, for running MongoDB locally)
3. MongoDB instance (local or remote)
4. Google OAuth Developer credentials

### Setup MongoDB

```bash
# Run MongoDB in Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Configure Environment Variables

Create a `.env` file in the project root or set these environment variables:

```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
MONGODB_URI=mongodb://localhost:27017/auth_service
JWT_SECRET=a-secure-jwt-secret-for-local-development
FRONTEND_URL=http://localhost:19006
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006,http://localhost:19000
```

### Running Locally

1. Clone the repository
2. Set up environment variables
3. Run the application using:

```bash
./gradlew bootRun
```

## Testing OAuth Integration

You can test OAuth integration using these endpoints:

- `/api/oauth/config` - Get OAuth configuration for clients
- `/api/oauth/test` - Test endpoint to verify OAuth integration
- `/oauth2/authorization/google` - Start Google OAuth flow

## Debugging

Refer to the `JWT_DEBUG_GUIDE.md` file for detailed information on troubleshooting JWT issues.

For CORS issues, enable debug logging by setting:

```
logging.level.org.springframework.web.cors=DEBUG
```

## Security Best Practices

- Keep your JWT secret secure and different in each environment
- Make sure the CORS configuration allows only your frontend domains
- Set appropriate token expiration (default is 24 hours)
- Use HTTPS in production
- Follow the principle of least privilege for API endpoints
