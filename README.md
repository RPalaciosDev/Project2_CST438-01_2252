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
- [Cross-Platform Development](#cross-platform-development)

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
   
   Windows (PowerShell):
   ```powershell
   .\frontend.ps1
   ```

   Unix-like systems (Linux/macOS):
   ```bash
   chmod +x frontend.sh
   ./frontend.sh
   ```
   These scripts update Expo packages to their required versions and launch the development server.

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
- Java 21 (for backend services)
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
├── chat_api/           # Real-time chat functionality
├── image-storage-service/ # Image handling and storage
├── nginx/              # Reverse proxy and SSL
├── secrets/           # Secure credential storage
├── data/              # Directory for all service data volumes
│   ├── postgres/      # PostgreSQL data
│   ├── mongodb/       # MongoDB data
│   ├── cassandra/     # Cassandra data
│   └── redis/         # Redis data
├── docker/            # Shared Docker configurations
└── utils/             # Utility scripts for cross-platform development
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
  - Conversation management
- **Databases**: 
  - Cassandra (for message storage)
  - Redis (for caching and pub/sub)
- **Environment Variables**:
  - `SPRING_DATA_CASSANDRA_KEYSPACE_NAME`: Cassandra keyspace name (default: chat_keyspace)
  - `SPRING_DATA_CASSANDRA_CONTACT_POINTS`: Cassandra contact points (default: cassandra)
  - `SPRING_DATA_CASSANDRA_PORT`: Cassandra port (default: 9042)
  - `SPRING_DATA_CASSANDRA_DATACENTER`: Cassandra datacenter (default: DC1)
  - `SPRING_DATA_REDIS_HOST`: Redis host (default: redis)
  - `SPRING_DATA_REDIS_PORT`: Redis port (default: 6379)
  - `SPRING_DATA_REDIS_PASSWORD`: Redis password

### Image Storage Service
- **Technology**: Spring Boot
- **Port**: 8084
- **Features**:
  - Image upload/download
  - Automatic S3 to MongoDB synchronization
  - Metadata management
  - Secure file storage
  - Support for multiple image formats
  - Automatic error handling and retry mechanisms
- **Storage**: 
  - AWS S3 (for image files)
  - MongoDB (for metadata)
- **Environment Variables**:
  - `AWS_ACCESS_KEY_ID`: AWS access key for S3 bucket access
  - `AWS_SECRET_ACCESS_KEY`: AWS secret key for S3 bucket access
  - `AWS_S3_BUCKET`: Name of the S3 bucket (default: strawhat-tierlist-images)
  - `AWS_S3_REGION`: AWS region (default: us-east-2)
  - `MONGO_ROOT_PASSWORD`: MongoDB root password

## Development Setup

1. **Environment Configuration**
   - Run the setup script (`setup.ps1` or `setup.sh`)
   - Review generated `credentials.txt`
   - Configure Google OAuth2 (see below)

2. **Frontend Setup**
   - Run the frontend script (`frontend.ps1` or `frontend.sh`)
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
   - [ ] Verify Cassandra and Redis configuration for chat service

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
  - Cassandra and Redis for chat service

### Environment Files
- `.env`: Development environment variables
- `.env.production`: Production settings
- `application.yml`: Service-specific configuration
- `secrets/`: Secure credentials storage (db_password.txt, mongo_password.txt, redis_password.txt)

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

#### Line Ending Issues
If you encounter issues with shell scripts not executing properly, it may be due to incorrect line endings:

**On Windows:**
```powershell
# Fix line endings with PowerShell
(Get-Content path\to\file.ext) | Set-Content -Encoding UTF8 path\to\file.ext
```

**On macOS/Linux:**
```bash
# Fix line endings with dos2unix
dos2unix path/to/file.ext
```

#### Service Connection Issues
- Check if all required services are running: `docker-compose ps`
- View service logs: `docker-compose logs [service-name]`
- Ensure environment variables are set correctly
- Verify network connectivity between services

#### Database Issues
- Verify data volumes are properly mounted
- Check database logs for errors
- Ensure credentials are correct
- For Cassandra: verify keyspace creation script executed successfully

## Cross-Platform Development

This project is designed to work seamlessly across Windows, macOS, and Linux platforms. See [CROSS_PLATFORM.md](CROSS_PLATFORM.md) for detailed guidelines on cross-platform development.

### Key Cross-Platform Features

1. **Platform-Specific Setup Scripts**
   - `setup.sh` for macOS/Linux
   - `setup.ps1` for Windows

2. **Consistent Line Endings**
   - .gitattributes configuration for automatic line ending normalization
   - Docker containers with automatic line ending conversion

3. **Path Management**
   - Utils provided for handling path separators across platforms
   - All Dockerfiles use forward slashes for paths

4. **Docker Compatibility**
   - Container configuration works on all platforms
   - Volume mounts use cross-platform paths
   - Services include dos2unix for script normalization

5. **Development Tools**
   - Cross-platform IDE configurations
   - Shared linting and formatting rules
   - Path utilities for JavaScript and Java codebases

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Expo Team for the mobile framework
- Spring Boot Team for the backend framework
- All contributors to this project


