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
└── compose.yaml        # Docker compose configuration
```

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


