# LoveTiers App

A modern application for creating and sharing tier lists in a dating app style.

## Table of Contents
- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Services Overview](#services-overview)
  - [Frontend Service](#frontend-service)
  - [Authentication Service](#authentication-service)
  - [Tier List Service](#tier-list-service)
  - [Chat Service](#chat-service)
  - [Image Storage Service](#image-storage-service)
  - [ML Service](#ml-service)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Configuration Management](#configuration-management)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Authentication System](#authentication-system)

## Quick Start

1. **Clone the Repository**
   ```bash
   git clone https://github.com/CST438-Org/Project2_CST438-01_2252.git
   cd Project2_CST438-01_2252
   ```

2. **Run Setup Script**
   
   Windows (PowerShell):
   ```powershell
   .\setup.ps1
   ```

   Unix-like systems (Linux/macOS):
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```
   This script will install all dependencies and prepare your environment.

3. **Start Frontend Expo App**
   ```bash
   chmod +x frontend.sh
   ./frontend.sh
   ```
   This script updates Expo packages to their required versions and launches the development server.

4. **Running Backend Services (Optional)**
   ```bash
   docker-compose up -d
   ```

### Alternative Setup (Optional)

If the scripts aren't working for you:

1. **Install Dependencies Manually**
   ```bash
   npm install
   ```

2. **Start Development Server Manually**
   ```bash
   npx expo start
   ```

## Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Docker and Docker Compose (for running backend services locally)
- Git
- Java 17 (for backend services)

## Project Structure

```
├── frontend/             # Expo React Native application
│   ├── app/              # App directory (Expo Router)
│   ├── components/       # Reusable components
│   ├── services/         # API services
│   ├── styles/           # Shared styles
│   └── types/            # TypeScript types
├── auth_user_api/        # Authentication microservice
├── auth-user-service/    # Authentication service (Spring Boot)
├── tier-list-service/    # Tier list management service (Spring Boot)
├── chat_api/             # Real-time chat functionality (Spring Boot)
├── image-storage-service/# Image handling and storage (Spring Boot)
├── ml-service/           # Machine learning service (Python)
├── secrets/              # Secure credential storage
├── docker/               # Shared Docker configurations
├── compose.yaml          # Docker compose configuration for development
├── docker-compose.prod.yml # Docker compose configuration for production
└── setup scripts         # setup.sh, setup.ps1, frontend.sh
```

## Services Overview

### Frontend Service
- **Technology**: Expo/React Native
- **Port**: 19006
- **Features**:
  - Mobile-first design
  - Offline support
  - Real-time updates
  - Drag-and-drop interface
- **Development**:
  ```bash
  cd frontend
  npm install
  npx expo start
  ```

### Authentication Service
- **Technology**: Spring Boot
- **Port**: 8081
- **Features**:
  - OAuth2 with Google
  - JWT token management
  - User management
- **Database**: MongoDB
- **Environment Variables**:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `JWT_SECRET`
  - `MONGO_ROOT_PASSWORD`

### Tier List Service
- **Technology**: Spring Boot
- **Port**: 8082
- **Features**:
  - Tier list CRUD operations
  - Category management
  - Voting system
- **Database**: MongoDB
- **Environment Variables**:
  - `SPRING_DATA_MONGODB_URI`
  - `ALLOWED_ORIGINS`

### Chat Service
- **Technology**: Spring Boot
- **Port**: 8083
- **Features**:
  - Real-time messaging
  - WebSocket support
  - Chat history
- **Database**: Cassandra 
- **Environment Variables**:
  - `SPRING_DATA_CASSANDRA_KEYSPACE-NAME`
  - `SPRING_DATA_CASSANDRA_CONTACT-POINTS`
  - `SPRING_DATA_CASSANDRA_PORT`
  - `SPRING_DATA_CASSANDRA_DATACENTER`

### Image Storage Service
- **Technology**: Spring Boot
- **Port**: 8084
- **Features**:
  - Image upload/download
  - Metadata management
  - Secure file storage
  - Support for multiple image formats
- **Storage**: 
  - AWS S3 (for image files)
  - MongoDB (for metadata)
- **Environment Variables**:
  - `AWS_ACCESS_KEY_ID`: AWS access key for S3 bucket access
  - `AWS_SECRET_ACCESS_KEY`: AWS secret key for S3 bucket access
  - `AWS_S3_REGION`: AWS region
  - `AWS_S3_BUCKET`: Name of the S3 bucket
  - `SPRING_DATA_MONGODB_URI`: MongoDB connection string

### ML Service
- **Technology**: Python
- **Features**:
  - Content analysis
  - RabbitMQ integration for messaging
  - Machine learning predictions
- **Environment Variables**:
  - Configured in railway.toml

## Development Setup

1. **Environment Configuration**
   - Create a `.env` file in the root directory based on `.env.example`
   - Configure environment variables for services you'll be using

2. **Running All Services**
   ```bash
   # Start all services with Docker Compose
   docker-compose up -d
   ```

3. **Frontend Development**
   ```bash
   # Use the frontend script
   chmod +x frontend.sh
   ./frontend.sh
   
   # Or manually
   cd frontend
   npm install
   npx expo start
   ```

4. **Google OAuth2 Setup** (if using authentication)
   - Visit [Google Cloud Console](https://console.cloud.google.com)
   - Create/select a project
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add redirect URIs as needed

## Production Deployment

1. **Environment Setup**
   ```bash
   # Copy production configuration
   cp .env.example .env.production
   # Update with production values
   ```

2. **Start Services in Production Mode**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Production Checklist**
   - [ ] Configure production environment variables
   - [ ] Update OAuth2 redirect URIs
   - [ ] Configure production database credentials
   - [ ] Set up monitoring and logging
   - [ ] Configure backup strategy

## Configuration Management

### Development vs Production
- Development: Uses `compose.yaml`
  - Hot-reloading enabled
  - Debug logging
  - Local database instances

- Production: Uses `docker-compose.prod.yml`
  - SSL enabled
  - Optimized for performance
  - Secure credential management

### Environment Files
- `.env`: Development environment variables
- `.env.production`: Production settings
- `railway.toml`: Railway deployment configurations

## Security

### Best Practices
- Never commit sensitive data to Git
- Use SSL/TLS in production
- Implement rate limiting
- Enable security headers

### SSL Configuration
- Development: Self-signed certificates or HTTP
- Production: Use Let's Encrypt or commercial SSL
- Configure HTTPS redirect

## Troubleshooting

### Common Issues

1. **Expo Issues**
   - Clear cache: `npx expo start --clear`
   - Restart development server
   - Check Expo documentation for version-specific issues

2. **Database Connection Issues**
   - Verify credentials in `.env`
   - Check database service is running
   - Confirm port availability

3. **OAuth2 Authentication Failures**
   - Verify Google credentials
   - Check redirect URI configuration
   - Confirm SSL certificate validity

4. **Container Startup Issues**
   ```bash
   # View service logs
   docker-compose logs [service-name]
   
   # Restart specific service
   docker-compose restart [service-name]
   ```

### Getting Help
- Check application logs
- Review error messages in browser/device console
- Open an issue on the GitHub repository

## Authentication System

This project implements a robust authentication system using JWT-based authentication and authorization.

### Features

- JWT-based authentication for API endpoints
- User registration and login with password encryption
- Google OAuth2 login integration
- Token validation and refresh
- Role-based authorization

### JWT Authentication Flow

1. **User Registration/Login**: User registers or logs in via API endpoints
2. **Google OAuth**: Alternatively, user can log in via Google OAuth
3. **JWT Generation**: On successful authentication, a JWT token is generated
4. **Token Usage**: Frontend stores the token and includes it in the `Authorization` header
5. **Token Validation**: Backend validates the token


