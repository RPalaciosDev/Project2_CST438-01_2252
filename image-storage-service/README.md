# Image Storage Service

A specialized Spring Boot service handling image storage, metadata management, and tag analysis for the LoveTiers application.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [API Endpoints](#api-endpoints)
- [Tag System](#tag-system)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Future Improvements](#future-improvements)
- [Railway Deployment Guide for Beginners](#railway-deployment-guide-for-beginners)

## Project Overview
The **Image Storage Service** allows users to retrieve images from AWS S3 and stores their metadata in MongoDB. The metadata includes:
- File name
- S3 URL
- Uploaded by
- S3 key
- File size

## Technologies Used
- **Spring Boot** (Java)
- **MongoDB** (for storing image metadata)
- **AWS S3** (for cloud storage)
- **Docker** (for containerized deployment)
- **Spring Security** (for authentication and authorization)

## Project Structure
```
image-storage-service/
│── src/main/java/com/cst438/image/
│   ├── ImageStorageServiceApplication.java     # Main entry point of the service
│   ├── config/
│   │   ├── MongoConfig.java                    # MongoDB client configuration
│   │   ├── S3Config.java                       # AWS S3 client configuration
│   │   ├── SecurityConfig.java                 # Spring Security configuration
│   ├── controller/
│   │   ├── ImageMetadataController.java        # REST API endpoints for image metadata
│   │   ├── ServiceInfoController.java          # Provides service information and health checks
│   ├── model/
│   │   ├── ImageMetadataDocument.java          # MongoDB document structure
│   ├── repository/
│   │   ├── ImageMetadataRepository.java        # MongoDB repository for image metadata
│   ├── service/
│   │   ├── ImageMetadataService.java           # Service handling MongoDB operations
│   │   ├── StorageService.java                 # AWS S3 storage and retrieval logic
│── Dockerfile                                  # Docker configuration
│── README.md                                   # Project documentation
```

### File Descriptions
- **`ImageStorageServiceApplication.java`**: Main class that starts the Spring Boot application.
- **`MongoConfig.java`**: Configures MongoDB client and repository settings.
- **`S3Config.java`**: Configures AWS S3 client for uploading and retrieving images.
- **`SecurityConfig.java`**: Manages authentication and security settings.
- **`ImageMetadataController.java`**: Exposes RESTful endpoints to interact with image metadata.
- **`ServiceInfoController.java`**: Provides service information, capabilities, and health checks.
- **`ImageMetadataDocument.java`**: Defines the MongoDB document structure for image metadata.
- **`ImageMetadataRepository.java`**: MongoDB repository interface for CRUD operations on image metadata.
- **`ImageMetadataService.java`**: Handles logic for storing and retrieving image metadata from MongoDB.
- **`StorageService.java`**: Provides methods for uploading images to AWS S3 and retrieving URLs.

## Features

- **Cloud Storage Integration**
  - AWS S3 bucket integration for scalable and reliable image storage
  - Automatic synchronization between S3 and MongoDB
  - Secure credential handling through environment variables

- **Metadata Management**
  - MongoDB-based tracking of image metadata
  - Support for folders, categories, and custom attributes
  - Efficient image retrieval by ID, folder, or other attributes

- **Tag Analysis System**
  - Automatic tag extraction from image file paths and metadata
  - Real-time tag frequency calculation and caching
  - Optimized API for tier-builder to access tag frequencies

- **Cross-Service Integration**
  - Exposed REST API for other microservices
  - Integration with tier-list-service for image retrieval
  - Support for the frontend tier-builder component

- **Security & Performance**
  - Spring Security integration for authentication
  - Optimized image loading and caching
  - Configurable CORS for cross-origin resource sharing

## Tech Stack

- **Core**: Spring Boot 3.2.2, Java 21
- **Storage**: AWS S3 SDK 2.24.0
- **Database**: MongoDB (Spring Data MongoDB)
- **API**: RESTful API with Spring Web
- **Security**: Spring Security
- **Build Tool**: Gradle
- **Deployment**: Docker, Railway

## Architecture

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   Frontend    │     │  Tier List    │     │   Auth User   │
│  Application  │     │   Service     │     │    Service    │
└───────┬───────┘     └───────┬───────┘     └───────────────┘
        │                     │
        │  ┌─────────────────┼─────────────────┐
        │  │                 │                 │
┌───────▼──▼─────┐   ┌───────▼───────┐   ┌─────▼───────┐
│  Image Storage  │   │     AWS S3    │   │   MongoDB   │
│     Service     │◄──┤     Bucket    │   │  Database   │
└─────────────────┘   └───────────────┘   └─────────────┘
```

### Core Components

1. **Service Layer**
   - `StorageService`: Handles synchronization between S3 and MongoDB
   - `ImageMetadataService`: Manages image metadata operations
   - `TagService`: Analyzes and manages tag statistics

2. **Model Layer**
   - `ImageMetadataDocument`: Represents image metadata in MongoDB
   - `TagFrequencyDocument`: Stores tag frequency statistics

3. **Controller Layer**
   - `ImageMetadataController`: Exposes endpoints for image operations
   - `TagController`: Provides tag-related endpoints
   - `ServiceInfoController`: Offers service documentation and status

4. **Repository Layer**
   - `ImageMetadataRepository`: MongoDB operations for image data
   - `TagFrequencyRepository`: MongoDB operations for tag statistics

## API Endpoints

### Service Information

- `GET /` - Summary of service capabilities
- `GET /service-info` - Detailed service information
- `GET /api/info` - System status and technical details

### Image Operations

- `GET /api/images` - Retrieve all images or filter by folder
- `GET /api/images/{id}` - Get image by ID
- `POST /api/images/store` - Store image metadata
- `POST /api/images/sync` - Manually trigger S3 to MongoDB sync

### Tag System

- `GET /api/tags/frequencies` - Get pre-calculated tag frequencies
- `POST /api/tags/refresh` - Force recalculation of tag frequencies

## Tag System

The Tag System is a key feature that works across multiple services to enhance the tier list building experience:

### Tag Extraction and Analysis

- **Automatic Extraction**: The service analyzes image paths and filenames to extract tags
- **Pattern Recognition**: Tags are identified from folder structures and filenames
- **Frequency Calculation**: Tags are counted and sorted by popularity

### Integration with Tier Builder

- **Pre-computation**: Tag frequencies are calculated server-side to optimize frontend performance
- **API Access**: The tier-builder UI fetches tag data via `/api/tags/frequencies`
- **Real-time Updates**: When new images are synced, tag statistics are automatically refreshed

### How It Works

1. When images are synced from S3 to MongoDB, the system parses filenames and paths
2. Tags are extracted from path segments that aren't file extensions
3. A frequency map is built, counting occurrences of each tag
4. This data is stored in the `tag_frequencies` collection with a single document
5. The frontend tier-builder fetches this pre-computed data for fast category browsing

### Benefits

- **Performance Optimization**: Avoids client-side tag calculation
- **Consistent Categorization**: Ensures tags are extracted uniformly
- **Reduced Network Load**: Sends compact frequency data instead of raw paths

## Setup Instructions

### Prerequisites

- Java 21 or later
- Docker and Docker Compose
- AWS Account with S3 bucket
- MongoDB instance

### Environment Variables

Create a `.env` file with the following variables:

```
# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_REGION=us-east-2
AWS_S3_BUCKET=your_s3_bucket_name

# MongoDB Configuration
SPRING_DATA_MONGODB_URI=mongodb://username:password@host:port/database

# Application Settings
SERVER_PORT=8084
APP_DOMAIN=your-domain.example.com

# Security (if applicable)
JWT_SECRET=your_jwt_secret
```

## Running the Application

### Using Startup Scripts (Recommended)

The easiest way to run the application is using the provided startup scripts:

#### On macOS/Linux:
```bash
./start.sh
```

#### On Windows:
```cmd
start.bat
```

These scripts automatically load environment variables from the `.env` file in the project root directory.

### Manual Environment Variable Setup

If you prefer to set environment variables manually:

#### On macOS/Linux:
```bash
export AWS_ACCESS_KEY_ID=your_aws_access_key
export AWS_SECRET_ACCESS_KEY=your_aws_secret_key
export AWS_S3_REGION=us-east-2
export AWS_S3_BUCKET=your_s3_bucket_name
./gradlew bootRun
```

#### On Windows:
```cmd
set AWS_ACCESS_KEY_ID=your_aws_access_key
set AWS_SECRET_ACCESS_KEY=your_aws_secret_key
set AWS_S3_REGION=us-east-2
set AWS_S3_BUCKET=your_s3_bucket_name
gradlew.bat bootRun
```

### Local Development

   ```bash
# Clone the repository
git clone https://github.com/yourusername/image-storage-service.git
cd image-storage-service

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run with Gradle
./gradlew bootRun
```

### Using Docker

   ```bash
# Build the Docker image
docker build -t image-storage-service .

# Run the container
docker run -p 8084:8084 --env-file .env image-storage-service
```

### Using Docker Compose

   ```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f image-storage-service
```

## Deployment

### Railway Deployment

This service is configured for easy deployment on Railway:

1. Fork the repository
2. Connect to Railway and select the repository
3. Railway will automatically detect the Dockerfile
4. Configure environment variables in Railway dashboard
5. Deploy the service

For detailed instructions, see [RAILWAY.md](RAILWAY.md).

## Troubleshooting

### Common Issues

#### S3 Connection Problems

- Check AWS credentials in environment variables
- Verify S3 bucket permissions (should allow read/write)
- Ensure proper region configuration

#### MongoDB Connection Issues

- Validate MongoDB connection string
- Check database user permissions
- Verify network connectivity to MongoDB instance

#### Tag System Not Working

- Trigger manual refresh with `POST /api/tags/refresh`
- Check logs for parsing errors
- Verify folder structure in S3 bucket

#### Image Metadata Missing

- Run manual sync with `POST /api/images/sync`
- Check S3 bucket for expected images
- Review logs for synchronization errors

### Logs and Debugging

To view detailed logs:

   ```bash
# For Docker deployments
docker logs -f image-storage-service

# For Railway deployments
railway logs
```

## Integration Guide

### Connecting from Frontend

```javascript
// Example code for accessing images
const fetchImages = async (folder) => {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_IMAGE_API_URL}/api/images?folder=${folder}`
  );
  return await response.json();
};

// Example code for accessing tag frequencies
const fetchTagFrequencies = async () => {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_IMAGE_API_URL}/api/tags/frequencies`
  );
  return await response.json();
};
```

### Connecting from Tier List Service

```java
// Example WebClient configuration in a Spring service
@Bean
@Qualifier("imageServiceWebClient")
public WebClient imageServiceWebClient(
        @Value("${services.image-storage-service.url}") String baseUrl) {
    return WebClient.builder()
            .baseUrl(baseUrl)
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .build();
}
```
