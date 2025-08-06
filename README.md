# LoveTiers App

A modern, mobile-first application for creating and sharing tier lists. Built with Expo, React Native, and a microservices architecture. Features secure HTTPS communication, OAuth2 authentication, and personalized tier list recommendations.

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Repository Structure](#repository-structure)
- [Project Structure](#project-structure)
- [Services Overview](#services-overview)
  - [Frontend Service](#frontend-service)
  - [Authentication Service](#authentication-service)
  - [Tier List Service](#tier-list-service)
  - [Chat Service](#chat-service)
  - [Image Storage Service](#image-storage-service)
  - [ML Service](#ml-service)
- [Key Features](#key-features)
  - [Tag System Integration](#tag-system-integration)
  - [Daily Tier Lists](#daily-tier-lists)
- [Deployment Strategy](#deployment-strategy)
- [Configuration Management](#configuration-management)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Enhanced Authentication System](#enhanced-authentication-system)

## Quick Start

### For Local Development
For local development setup and troubleshooting, see [LOCAL_DEVELOPMENT_SETUP.md](LOCAL_DEVELOPMENT_SETUP.md) for detailed instructions on running all services locally.

### For Railway Deployment

1. **Clone Repository**

   ```bash
   git clone https://github.com/RPalaciosDev/Project2_CST438-01_2252
   cd Project2_CST438-01_2252
   ```

2. **Deploy Individual Services to Railway**
   - Deploy each microservice separately to Railway using their provided documentation.
   - See [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) for detailed instructions.

3. **Configure Environment Variables**
   - Use Railway's environment variable management system to configure each service.
   - Reference the `.env.example` file for required variables for each service.

## Prerequisites

- [Railway](https://railway.app/) account
- Node.js (v18 or later)
- Git
- Java 17 (for backend services)
- Python 3.9+ (for ML service)

## Repository Structure

This repository focuses on individual microservice deployment to Railway.

The current repository structure emphasizes:

- Individual, independently deployable microservices
- Service-specific configurations
- Railway-first deployment approach


## Project Structure

```
├── frontend/             # Expo React Native application
│   ├── app/              # App directory (Expo Router)
│   │   ├── tierlists/    # Tier list components and pages
│   │   ├── chats/        # Chat functionality
│   │   ├── auth/         # Authentication flows
│   │   ├── context/      # React context providers
│   ├── components/       # Reusable components
│   ├── services/         # API services
│   ├── store/            # State management
│   ├── styles/           # Shared styles
│   └── types/            # TypeScript types
├── auth_user_api/        # Authentication microservice (Java)
├── tier-list-service/    # Tier list management service (Java)
├── chat_api/             # Real-time chat functionality (Java)
├── image-storage-service/ # Image handling and storage (Java)
├── ml-service/           # Machine learning service for matching (Python)
├── .env.example          # Example environment variables
└── RAILWAY_DEPLOYMENT.md # Railway deployment instructions
```

## Services Overview

### Frontend Service

- **Technology**: Expo/React Native
- **Port**: 19006
- **Features**:
  - Mobile-first design with responsive UI
  - Offline support with data synchronization
  - Real-time updates for chat and notifications
  - Drag-and-drop tier list creation interface
  - Authentication with email/password and Google OAuth
  - Tag-based tier list organization and discovery
  - Animated sidebar with daily tier list tracking
  - Personalized experience based on user preferences
- **Deployment**:

  ```bash
  # Deploy to Railway
  cd frontend
  railway up
  ```

### Authentication Service

- **Technology**: Spring Boot
- **Port**: 8081
- **Features**:
  - OAuth2 with Google
  - JWT token management
  - User management with roles and permissions
  - User preferences storage
  - Tag recording for personalization
  - Profile completion tracking
- **Database**: MongoDB
- **Environment Variables**:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `JWT_SECRET`
  - `MONGO_ROOT_PASSWORD`
  - `ALLOWED_ORIGINS`
  - `FRONTEND_URL`

### Tier List Service

- **Technology**: Spring Boot
- **Port**: 8082
- **Features**:
  - Tier list CRUD operations
  - Category and tag management
  - Daily tier list system
  - User tier list completion tracking
  - Template management
  - Voting and ranking system
- **Database**: MongoDB
- **Environment Variables**:
  - `MONGO_ROOT_PASSWORD`
  - `MONGO_URI`

### Chat Service

- **Technology**: Spring Boot
- **Port**: 8083
- **Features**:
  - Real-time messaging
  - WebSocket support
  - Chat history and message persistence
  - User online status tracking
  - Typing indicators
- **Database**: PostgreSQL
- **Environment Variables**:
  - `POSTGRES_USER`
  - `POSTGRES_PASSWORD`
  - `POSTGRES_CHAT_DB`

### Image Storage Service

- **Technology**: Spring Boot
- **Port**: 8084
- **Features**:
  - Image upload/download
  - Automatic S3 to MongoDB synchronization
  - Metadata management with tag extraction
  - Tag frequency tracking
  - Secure file storage with access control
  - Support for multiple image formats
  - Automatic error handling and retry mechanisms
- **Storage**:
  - AWS S3 (for image files)
  - MongoDB (for metadata)
- **Environment Variables**:
  - `AWS_ACCESS_KEY`: AWS access key for S3 bucket access
  - `AWS_SECRET_KEY`: AWS secret key for S3 bucket access
  - `AWS_S3_BUCKET`: Name of the S3 bucket (default: strawhat-tierlist-images)
  - `AWS_REGION`: AWS region (default: us-east-2)
  - `MONGO_ROOT_PASSWORD`: MongoDB root password
  - `MONGO_URI`: MongoDB connection string

### ML Service

- **Technology**: Python, Flask
- **Port**: 8085
- **Features**:
  - User matching based on tier list preferences
  - Tag-based recommendation system
  - Statistical analysis of user preferences
  - Real-time matching with API endpoints
- **Dependencies**:
  - Python 3.9+
  - Flask
  - NumPy
  - Pandas
- **Environment Variables**:
  - `MODEL_PATH`: Path to ML model files
  - `DEBUG`: Enable/disable debug mode

## Key Features

### Tag System Integration

The app features a comprehensive tag system that works across multiple services:

- **Image Storage Service**:
  - Extracts and stores tags from image metadata
  - Maintains tag frequencies based on usage
  - Provides API endpoints for tag search and frequencies

- **Authentication Service**:
  - Records user tag preferences and interactions
  - Stores tag-based user statistics
  - Provides personalization data for recommendations

- **Tier List Service**:
  - Associates tags with tier list templates
  - Enables tag-based searching and filtering
  - Tracks tag popularity for trending features

- **Frontend**:
  - Tag-based browsing in the tier list explorer
  - Tag recording during tier list submissions
  - Tag selection in tier list builder

### Daily Tier Lists

The app implements a daily tier list feature to encourage regular user engagement:

- **Daily List Selection**:
  - Admin-configurable daily tier list
  - Automatic rotation of featured lists

- **User Tracking**:
  - Per-user completion status tracking
  - Rewards system for consistent participation

- **UI Integration**:
  - Animated sidebar with real-time status updates
  - Visual indication of completion status
  - Easy access to the current daily tier list

- **Backend Services**:
  - API endpoints for setting and retrieving daily lists
  - Completion status management
  - Analytics on completion rates

## Deployment Strategy

This project uses Railway for deployment of all microservices. Each service is deployed independently, allowing for:

1. **Independent Scaling**: Each service can be scaled according to its specific needs
2. **Isolated Updates**: Services can be updated without affecting the entire system
3. **Technology Flexibility**: Each service can use the most appropriate technology stack
4. **Simplified CI/CD**: Railway handles the continuous deployment process

### Railway Deployment Process

1. **Service Setup**
   - Create a new project in Railway for each service
   - Connect to the GitHub repository
   - Configure the build settings for each service

2. **Environment Configuration**
   - Set the required environment variables in Railway's dashboard
   - Link shared resources (databases, storage) between services

3. **Custom Domains**
   - Configure custom domains for each service through Railway
   - Set up SSL certificates through Railway's automated system

4. **Monitoring**
   - Use Railway's built-in logs and metrics
   - Set up alerts for service health

For detailed deployment instructions, see [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md).

## Configuration Management

### Environment Variables

- Railway environment variables for service configuration
- `.env.example` as a reference for required variables
- Service-specific configuration in each microservice directory

### Security Best Practices

- Use Railway's secret management for sensitive credentials
- Never commit sensitive data to Git
- Use SSL/TLS for all services
- Implement rate limiting
- Enable security headers

## Security

### Best Practices

- Use secure password manager for team credentials
- Regularly rotate secrets
- Never commit sensitive data to Git
- Use SSL/TLS in production
- Implement rate limiting
- Enable security headers

### SSL Configuration

- Configure SSL through Railway's custom domain settings
- Ensure all services use HTTPS endpoints
- Configure CORS to allow only trusted origins
- Enable HTTP/2 where supported

## Troubleshooting

### Common Issues

1. **SSL Certificate Issues**
   - Ensure your Railway custom domains have valid SSL certificates
   - For local development, modern browsers accept localhost connections without HTTPS
   - When deploying to other platforms, use platform-specific SSL certificate setup

2. **Database Connection Issues**
   - Verify credentials in Railway environment variables
   - Check database service is running
   - Confirm port availability

3. **OAuth2 Authentication Failures**
   - Verify Google credentials
   - Check redirect URI configuration
   - Confirm SSL certificate validity

### Getting Help

- Check service logs in Railway dashboard
- Review error messages in browser console
- Contact team lead for credential issues

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Enhanced Authentication System

This project implements a robust authentication system using Spring Boot with OAuth2 Resource Server for JWT-based authentication and authorization.

### Features

- JWT-based authentication for API endpoints
- User registration and login with password encryption
- Google OAuth2 login integration
- Token validation and refresh
- Role-based authorization
- CORS configuration for frontend integration

### Security Configuration

The security configuration has been enhanced to use Spring Security's OAuth2 Resource Server capabilities, which provides a standardized way to validate and process JWT tokens.

### Key Components

1. **JwtTokenProvider**: Generates and validates JWT tokens
2. **JwtAuthConverter**: Converts JWT tokens to Spring Security Authentication objects
3. **CustomUserDetailsService**: Loads user details from MongoDB for authentication
4. **SecurityConfig**: Configures security filters, authentication, and authorization rules

### JWT Authentication Flow

The application uses a simplified JWT authentication flow:

1. **User Registration/Login**: User registers or logs in via `/api/auth/signup` or `/api/auth/signin`
2. **Google OAuth**: Alternatively, user can log in via Google OAuth at `/oauth2/authorization/google`
3. **JWT Generation**: On successful authentication, a JWT token is generated
4. **Token Usage**: Frontend stores the token and includes it in the `Authorization` header
5. **Token Validation**: Backend validates the token using the same secret key

### Environment Variables

For correct authentication configuration, set these environment variables in Railway:

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `JWT_SECRET` | Secret key for JWT signing | Yes | your-very-long-secret-key-should-be-kept-safe |
| `GOOGLE_CLIENT_ID` | Google OAuth2 client ID | For OAuth | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth2 client secret | For OAuth | - |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed origins | Yes | <http://localhost:3000,http://localhost:19006> |
| `FRONTEND_URL` | URL to redirect after OAuth login | Yes | <http://localhost:3000> |

### Best Practices

- Keep your JWT secret secure and different in each environment
- Make sure the CORS configuration allows your frontend domains
- Set appropriate token expiration (default is 24 hours)
- Use HTTPS in production
