# Image Storage Service

This service handles image uploads, storage, and synchronization with an AWS S3 bucket. It also maintains metadata in MongoDB, allowing for easy retrieval of image URLs.

## Table of Contents
- [Project Overview](#project-overview)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Running the Application](#running-the-application)
- [Manually Triggering `syncS3ToMongo()`](#manually-triggering-syncs3tomongo)
- [Troubleshooting](#troubleshooting)
- [Future Improvements](#future-improvements)

## Project Overview
The **Image Storage Service** allows users to upload images to AWS S3 and stores their metadata in MongoDB. The metadata includes:
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
│   │   ├── S3Config.java                       # AWS S3 client configuration
│   │   ├── SecurityConfig.java                 # Spring Security configuration
│   ├── controller/
│   │   ├── ImageMetadataController.java        # REST API endpoints for image metadata
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
- **`S3Config.java`**: Configures AWS S3 client for uploading and retrieving images.
- **`SecurityConfig.java`**: Manages authentication and security settings.
- **`ImageMetadataController.java`**: Exposes RESTful endpoints to interact with image metadata.
- **`ImageMetadataDocument.java`**: Defines the MongoDB document structure for image metadata.
- **`ImageMetadataRepository.java`**: MongoDB repository interface for CRUD operations on image metadata.
- **`ImageMetadataService.java`**: Handles logic for storing and retrieving image metadata from MongoDB.
- **`StorageService.java`**: Provides methods for uploading images to AWS S3 and retrieving URLs.

## Setup Instructions
### Prerequisites
Ensure you have the following installed:
- **Docker**
- **MongoDB**
- **AWS S3 Bucket**
- **Java 17 or later**

### Environment Variables
Set up your `.env` file with the following:
```
AWS_ACCESS_KEY=your_aws_access_key
AWS_SECRET_KEY=your_aws_secret_key
AWS_BUCKET_NAME=strawhat-tierlist-images
AWS_REGION=us-east-2
MONGO_URI=mongodb://root:your_password@mongodb:27017/image_storage_db
```

## Running the Application
To start the application using Docker:
```sh
docker compose up -d
```
This will spin up MongoDB and the image storage service.

To check logs:
```sh
docker logs -f project2_cst438-01_2252-image-storage-service-1
```

## Manually Triggering `syncS3ToMongo()`
If you need to manually synchronize AWS S3 images with MongoDB, execute the following inside the running container:
```sh
docker exec -it project2_cst438-01_2252-image-storage-service-1 sh
```
Then, inside the container, run:
```sh
curl -X POST http://localhost:8080/api/sync-s3
```
This will trigger the `syncS3ToMongo()` method and update the MongoDB database with any missing image metadata from S3.

## Troubleshooting
### Port 8080 Already in Use
If the application fails to start due to port conflicts, find and stop the process using:
```sh
netstat -tulpn | grep 8080
```
Then kill the process:
```sh
kill -9 <PID>
```
Alternatively, change the port in `application.properties`:
```properties
server.port=9090
```

### MongoDB Authentication Issues
If you see `Unauthorized: Command listDatabases requires authentication`, try connecting with:
```sh
docker exec -it mongodb mongosh -u root -p $MONGO_ROOT_PASSWORD --authenticationDatabase admin
Enter password: eH
```

Then, switch to the correct database:
```sh
use image_storage_db
```
If you need help finding it use:
```
show dbs
```

To see what collections are available:
```
show collections
```

To pull everything in the image folder:
```
db.images.find().pretty()
```




## Future Improvements
- Add **image deletion** functionality.
- Implement **role-based access control** for different users.
- Enable **image processing features** such as resizing or watermarking before uploading.
- Improve **logging and monitoring** with tools like Prometheus and Grafana.