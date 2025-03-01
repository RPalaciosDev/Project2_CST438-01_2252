# TierList App

A modern, mobile-first application for creating and sharing tier lists. Built with Expo, React Native, and a microservices architecture. Features secure HTTPS communication and SSL certificate implementation.

## Project Structure

```
├── docker/                # Shared Docker configurations
│   └── base.Dockerfile    # Base Dockerfile for Java services
├── frontend/             # Expo React Native application
│   ├── app/             # App directory (Expo Router)
│   ├── components/      # Reusable components
│   ├── services/        # API services
│   ├── styles/         # Shared styles
│   └── types/          # TypeScript types
├── auth-user-service/   # Authentication microservice
├── tier-list-service/   # Tier list management service
├── chat_api/           # Chat functionality service
├── nginx/              # Nginx configuration and SSL certificates
│   ├── nginx.conf      # Nginx server configuration
│   └── ssl/           # SSL certificates directory
├── secrets/            # Secure storage for sensitive data
├── compose.yaml        # Development environment configuration
├── docker-compose.prod.yml # Production environment configuration
├── .gitattributes     # Git attributes configuration
└── .dockerignore      # Global Docker ignore rules
```

## Configuration Files

### Git Configuration
The project uses a single root-level `.gitattributes` file that manages file attributes for all services:
- Line ending normalization (`text=auto`)
- Forced LF endings for shell scripts and Gradle wrapper
- Forced CRLF endings for Windows batch files
- Binary file handling for executables, images, and documents
- Consistent text file handling across all platforms

### Docker Configuration
A unified `.dockerignore` file at the root level controls which files are excluded from Docker builds:
- Build artifacts and dependencies
- Development-specific files
- IDE configurations
- Local environment files
- Test files and documentation
- Version control files

The global `.dockerignore` ensures:
- Smaller, more efficient Docker builds
- Consistent exclusion rules across all services
- Prevention of sensitive data leakage
- Proper handling of both frontend and backend files

## Development vs Production Environments

The project uses two different Docker Compose configurations for development and production environments:

### Development Environment (`compose.yaml`)
- **Purpose**: Local development with hot-reloading and debugging capabilities
- **Features**:
  - Development-specific ports (19000-19002) for Expo development server
  - Volume mounts for live code updates
  - Simple PostgreSQL setup with plain text passwords
  - Development-specific environment variables (`NODE_ENV=development`)
  - Basic nginx configuration without SSL
  - Direct access to service ports for debugging

### Production Environment (`docker-compose.prod.yml`)
- **Purpose**: Secure, optimized deployment configuration
- **Features**:
  - Enhanced Security:
    - Secret management for sensitive data
    - SSL/HTTPS configuration for nginx
    - MongoDB authentication
    - Secure database password handling
  - Production Optimizations:
    - Specific JVM options for better performance
    - Container restart policies
    - Production-specific ports and configurations
  - Additional Services:
    - MongoDB for auth service
    - SSL-enabled nginx reverse proxy
  - Environment Configuration:
    - Production environment variables
    - Optimized build arguments
    - Persistent volume configurations

### Key Differences

1. **Security**:
   - Development: Basic security for local testing
   - Production: Full security implementation with secrets, SSL, and secure databases

2. **Database Configuration**:
   - Development: Single PostgreSQL instance with simple setup
   - Production: PostgreSQL + MongoDB with secure authentication

3. **Performance**:
   - Development: Default configurations for easy debugging
   - Production: Optimized settings for better performance

4. **Deployment**:
   - Development: `docker-compose up`
   - Production: `docker-compose -f docker-compose.prod.yml up -d`

## Prerequisites

- Node.js (v18 or later)
- Docker and Docker Compose
- Expo CLI (`npm install -g expo-cli`)
- Java 17 (for backend services)
- Git
- OpenSSL (for SSL certificate generation)

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/tierlist-app.git
   cd tierlist-app
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Generate SSL certificates (if not already present):
   ```bash
   # Navigate to the nginx/ssl directory
   cd nginx/ssl
   
   # Generate self-signed certificates
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout privkey.pem -out fullchain.pem \
     -subj "/CN=localhost"
   ```

4. Start all services using Docker Compose:
   ```bash
   docker-compose up -d
   ```

5. For local development of the frontend:
   ```bash
   cd frontend
   npx expo start
   ```

## Environment Setup

1. Create a `.env` file in each service directory using the provided `.env.example` templates.
2. Ensure SSL certificate paths are correctly configured in the nginx configuration.

## Development

### Service Architecture

The application follows a microservices architecture with:
- Frontend (Expo/React Native)
- Authentication Service (Spring Boot)
- Tier List Service (Spring Boot)
- Chat Service (Spring Boot)
- Nginx as reverse proxy with SSL termination
- PostgreSQL as the database

### Security Features

- HTTPS encryption for all communications
- Self-signed SSL certificates for development
- Secure proxy configuration
- HTTP/2 support for improved performance

### Running Services

- All services: `docker-compose up`
- Individual service: `docker-compose up <service-name>`
- Frontend development: `cd frontend && npx expo start`
- Access the application securely at: `https://localhost`

## Features

- User authentication and authorization
- Create and manage tier lists
- Drag-and-drop interface
- Real-time updates
- Mobile-first design
- Cross-platform support (iOS, Android)
- Secure HTTPS communication

## Testing

Run tests for each service:

```bash
# Frontend tests
cd frontend && npm test

# Backend services tests (from service directories)
./gradlew test
```

## Deployment

1. Build and deploy all services:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. For frontend (Expo) standalone builds:
   ```bash
   cd frontend
   eas build
   ```

### Production SSL Setup
For production deployment:
1. Replace the self-signed certificates with valid SSL certificates from a trusted CA
2. Update the nginx configuration with the new certificate paths
3. Ensure proper SSL renewal process is in place

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Common Issues
1. SSL Certificate Issues
   - Ensure certificates are properly generated and placed in the `nginx/ssl` directory
   - Check nginx logs for certificate-related errors
   - Verify certificate permissions

2. 502 Bad Gateway
   - Check if all services are running (`docker-compose ps`)
   - Verify nginx configuration
   - Check service logs for potential issues

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Expo Team for the amazing framework
- React Native community
- All contributors to this project


