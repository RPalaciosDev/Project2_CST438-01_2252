# Image Storage Service Implementation Details

This document outlines the implementation details and work completed so far on the Image Storage Service.

## Overview

The Image Storage Service is a Spring Boot application that provides a REST API for storing and retrieving image metadata. The actual image files are stored in Amazon S3, while the metadata is stored in MongoDB. The service includes authentication using JWT tokens.

## Architecture

### Technologies Used

- **Spring Boot 3.2.2**: Framework for building the REST API
- **MongoDB**: Database for storing image metadata
- **Amazon S3**: Cloud storage for the actual image files
- **JWT**: For stateless authentication
- **Docker**: For containerization
- **Railway**: For deployment

### System Components

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Client App     │────▶│  Image Storage  │────▶│  MongoDB        │
│                 │     │  Service        │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │                 │
                        │  Amazon S3      │
                        │                 │
                        └─────────────────┘
```

## Implementation Details

### Authentication System (JWT)

We've implemented a JWT-based authentication system that includes:

1. **JwtUtil Class**
   - Located in `src/main/java/com/cst438/image/security/JwtUtil.java`
   - Handles token generation, validation, and parsing
   - Configured with a secret key from environment variables

2. **ApiUserDetailsService**
   - Located in `src/main/java/com/cst438/image/security/ApiUserDetailsService.java`
   - Implements Spring Security's UserDetailsService
   - Authenticates users against configured credentials (from environment variables)

3. **JwtRequestFilter**
   - Located in `src/main/java/com/cst438/image/security/JwtRequestFilter.java`
   - Intercepts incoming requests to validate JWT tokens
   - Extracts user details and adds them to the security context

4. **AuthController**
   - Located in `src/main/java/com/cst438/image/controller/AuthController.java`
   - Provides endpoint for generating JWT tokens (`/auth/login`)
   - Validates username/password and returns a token if valid

5. **SecurityConfig**
   - Located in `src/main/java/com/cst438/image/config/SecurityConfig.java`
   - Configures Spring Security with JWT authentication
   - Sets up CORS configuration for allowed origins
   - Defines which endpoints require authentication

### MongoDB Integration

- **ImageMetadata Model**
  - Represents the metadata for images stored in S3
  - Includes details like filename, S3 URL, upload timestamp, etc.

- **ImageMetadataRepository**
  - Spring Data MongoDB repository for CRUD operations on image metadata

### Amazon S3 Integration

- **S3Util Class**
  - Handles interactions with Amazon S3
  - Provides methods for uploading, downloading, and retrieving image files
  - Configured with environment variables for S3 access

### API Endpoints

The service exposes the following endpoints:

1. **Authentication**
   - `POST /auth/login`: Authenticates a user and returns a JWT token

2. **Image Management**
   - `GET /api/images`: Retrieves all image metadata
   - `POST /api/images/store`: Stores metadata for an image
   - `POST /api/images/sync`: Synchronizes S3 images with MongoDB storage

3. **Service Information**
   - `GET /service-info`: Returns detailed information about the service
   - `GET /api/info`: Returns basic service information
   - `GET /`: Root endpoint that redirects to service info

### Security Configuration

The security configuration includes:

1. **CORS Configuration**
   - Configurable allowed origins via environment variables
   - Default origins included for local development
   - Methods, headers, and credentials configured for proper API access

2. **Endpoint Security**
   - Public endpoints: `/`, `/auth/login`, `/api/info`, `/service-info`
   - Protected endpoints: `/api/images/**` (requires authentication)

3. **JWT Validation**
   - JWT tokens required for protected endpoints
   - Token validation based on signature and expiration
   - User identity checked against the token subject

## Railway Deployment

The service is configured for deployment on Railway with:

1. **Docker Configuration**
   - Optimized Dockerfile for Railway deployment
   - Multi-stage build process for smaller final image
   - Proper environment variable handling

2. **Environment Variables**
   - AWS credentials and configuration
   - MongoDB connection details
   - JWT and API authentication settings
   - Application domain configuration
   - CORS allowed origins

## Recent Improvements

1. **JWT Authentication Implementation**
   - Added JwtUtil, JwtRequestFilter, and ApiUserDetailsService
   - Integrated with Spring Security
   - Created AuthController for token generation

2. **Railway Deployment Optimization**
   - Cleaned up Dockerfile to remove hardcoded credentials
   - Updated application.properties for Railway compatibility
   - Added proper environment variable support
   - Implemented domain configuration

3. **CORS Configuration Enhancement**
   - Added support for configurable allowed origins
   - Improved handling of CORS for cross-domain requests
   - Added environment variable support for allowed origins

4. **Monitoring and Health**
   - Configured Spring Boot Actuator for health endpoints
   - Added detailed service information endpoints
   - Improved logging configuration

## Next Steps

1. **Enhanced Image Processing**
   - Add thumbnail generation
   - Implement image resizing capabilities
   - Support additional image formats

2. **User Management**
   - Implement user registration and management
   - Add role-based access control
   - Support for user-specific image collections

3. **Performance Improvements**
   - Add caching for frequently accessed images
   - Optimize database queries
   - Implement pagination for large collections

4. **Integration with Frontend**
   - Complete integration with frontend applications
   - Implement websockets for real-time updates
   - Add support for image previews

## Troubleshooting

### Common Issues

1. **MongoDB Connection Issues**
   - Check the MongoDB URI is correctly formatted
   - Ensure the MongoDB service is running
   - Verify credentials and database name

2. **S3 Access Problems**
   - Validate AWS credentials are correct
   - Check S3 bucket permissions
   - Ensure the bucket exists in the specified region

3. **JWT Authentication Failures**
   - Verify the JWT secret is consistently set across deployments
   - Check token expiration settings
   - Confirm the client is sending the token correctly 