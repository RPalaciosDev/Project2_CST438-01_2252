# TierList App

A modern, mobile-first application for creating and sharing tier lists. Built with Expo, React Native, and a microservices architecture.

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
├── nginx/              # Nginx configuration
└── compose.yaml        # Docker compose configuration
```

## Prerequisites

- Node.js (v18 or later)
- Docker and Docker Compose
- Expo CLI (`npm install -g expo-cli`)
- Java 17 (for backend services)
- Git

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

3. Start all services using Docker Compose:
   ```bash
   docker-compose up -d
   ```

4. For local development of the frontend:
   ```bash
   cd frontend
   npx expo start
   ```

## Environment Setup

Create a `.env` file in each service directory using the provided `.env.example` templates.

## Development

### Service Architecture

The application follows a microservices architecture with:
- Frontend (Expo/React Native)
- Authentication Service (Spring Boot)
- Tier List Service (Spring Boot)
- Chat Service (Spring Boot)
- Nginx as reverse proxy
- PostgreSQL as the database

### Running Services

- All services: `docker-compose up`
- Individual service: `docker-compose up <service-name>`
- Frontend development: `cd frontend && npx expo start`

## Features

- User authentication and authorization
- Create and manage tier lists
- Drag-and-drop interface
- Real-time updates
- Mobile-first design
- Cross-platform support (iOS, Android)

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

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Expo Team for the amazing framework
- React Native community
- All contributors to this project


