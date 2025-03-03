# LoveTiers App

A modern, mobile-first application for creating and sharing tier lists. Built with Expo, React Native, and a microservices architecture. Features secure HTTPS communication and OAuth2 authentication.

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
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Configuration Management](#configuration-management)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

## Quick Start

1. **Clone and Install Dependencies**
   ```bash
   git clone https://github.com/yourusername/tierlist-app.git
   cd tierlist-app
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

3. **Setup and Start Frontend Expo App**
   ```bash
   chmod +x frontend.sh
   ./frontend.sh
   ```
   This script updates Expo packages to their required versions and launches the development server.

4. **Start Backend Services**
   
   Development:
   ```bash
   docker-compose up -d
   ```

   Production:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Prerequisites

- Node.js (v18 or later)
- Docker and Docker Compose
- Expo CLI (`npm install -g expo-cli`)
- Java 17 (for backend services)
- Git
- OpenSSL (for SSL certificates)

## Project Structure

```
├── frontend/             # Expo React Native application
│   ├── app/             # App directory (Expo Router)
│   ├── components/      # Reusable components
│   ├── services/        # API services
│   ├── styles/         # Shared styles
│   └── types/          # TypeScript types
├── auth-user-service/   # Authentication microservice
├── tier-list-service/  # Tier list management service
├── chat-service/       # Real-time chat functionality
├── image-storage-service/ # Image handling and storage
├── nginx/              # Reverse proxy and SSL
├── secrets/           # Secure credential storage
└── docker/            # Shared Docker configurations
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
- **Database**: PostgreSQL
- **Environment Variables**:
  - `POSTGRES_USER`
  - `POSTGRES_PASSWORD`
  - `POSTGRES_TIER_DB`

### Chat Service
- **Technology**: Spring Boot
- **Port**: 8083
- **Features**:
  - Real-time messaging
  - WebSocket support
  - Chat history
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
  - Automatic resizing
  - Thumbnail generation
- **Storage**: AWS S3
- **Environment Variables**:
  - `AWS_ACCESS_KEY`
  - `AWS_SECRET_KEY`
  - `AWS_S3_BUCKET`
  - `AWS_REGION`

## Development Setup

1. **Environment Configuration**
   - Run the setup script (`setup.ps1` or `setup.sh`)
   - Review generated `credentials.txt`
   - Configure Google OAuth2 (see below)

2. **Frontend Setup**
   - Run the frontend script (`frontend.sh`)
   - This updates required Expo packages to compatible versions
   - Launches the Expo development server
   - See the frontend README for more details

3. **Google OAuth2 Setup**
   a. Visit [Google Cloud Console](https://console.cloud.google.com)
   b. Create/select a project
   c. Enable Google+ API
   d. Create OAuth 2.0 credentials
   e. Add redirect URIs:
      - Development: `http://localhost:8081/login/oauth2/code/google`
      - Production: `https://your-domain.com/login/oauth2/code/google`

## Production Deployment

1. **Environment Setup**
   ```bash
   # Copy production configuration
   cp .env.example .env.production
   
   # Generate production certificates
   # (Use Let's Encrypt or similar for production)
   ```

2. **Start Services**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Production Checklist**
   - [ ] Replace self-signed certificates with valid SSL
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
  - MongoDB for auth service

### Environment Files
- `.env`: Development environment variables
- `.env.production`: Production settings
- `application.yml`: Service-specific configuration
- `secrets/`: Secure credentials storage

## Security

### Best Practices
- Use secure password manager for team credentials
- Regularly rotate secrets
- Never commit sensitive data to Git
- Use SSL/TLS in production
- Implement rate limiting
- Enable security headers

### SSL Configuration
- Development: Self-signed certificates
- Production: Use Let's Encrypt or commercial SSL
- Configure HTTPS redirect
- Enable HTTP/2

## Troubleshooting

### Common Issues

1. **SSL Certificate Issues**
   - Check certificate paths in nginx config
   - Verify certificate permissions
   - Ensure certificates are valid

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
- Check service logs: `docker-compose logs`
- Review error messages in browser console
- Check application logs in `logs/` directory
- Contact team lead for credential issues

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Expo Team for the mobile framework
- Spring Boot Team for the backend framework
- All contributors to this project


