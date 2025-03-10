# Nginx Removal Guide

This document explains the recent removal of Nginx from our project architecture and what it means for development and deployment.

## Changes Made

1. **Removed Nginx Reverse Proxy**:
   - Deleted the nginx directory and configuration files
   - Removed Nginx service from docker-compose files
   - Updated port mappings for direct service access

2. **Added CORS Configuration**:
   - All backend services now have proper CORS headers configured
   - Each service reads allowed origins from the `ALLOWED_ORIGINS` environment variable

3. **Updated Frontend Configuration**:
   - Frontend now uses direct URLs to backend services
   - Environment variables control these URLs for different environments

## Development Workflow Changes

### Before
- All API requests went through Nginx at `http://localhost:80`
- Nginx routed requests to appropriate services based on URL path
- Single origin for all API requests

### Now
- API requests go directly to each service's port
- Frontend must use full URLs including ports
- Cross-origin requests between frontend and backend services

## Service URLs

Local development URLs:
- Frontend: `http://localhost:19006`
- Auth Service: `http://localhost:8081`
- Tier List Service: `http://localhost:8082`
- Chat Service: `http://localhost:8083`
- Image Storage Service: `http://localhost:8084`

Docker container URLs:
- Frontend: `http://frontend:19006`
- Auth Service: `http://auth-service:8080`
- Tier List Service: `http://tier-list-service:8080`
- Chat Service: `http://chat-service:8080`
- Image Storage Service: `http://image-storage-service:8080`

## Benefits of This Change

1. **Simpler Architecture**: One less component to maintain and configure
2. **Consistent Environments**: Local development more closely matches Railway deployment
3. **Easier Debugging**: Direct access to services makes it easier to identify issues
4. **Better Security Control**: CORS is explicitly configured for each service

## Deployment Notes

For Railway deployment:
- Each service gets its own subdomain
- The Railway configuration has already been updated
- Environment variables control service URLs in production

## Getting Started

To start the development environment:
```bash
docker-compose up -d
```

To start the production environment:
```bash
docker-compose -f docker-compose.prod.yml up -d
``` 