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
docker exec -it mongodb mongosh -u admin -p $MONGO_ROOT_PASSWORD --authenticationDatabase admin
```

### S3 Synchronization Issues
If images are not appearing in the application:

1. Check S3 bucket permissions:
```sh
aws s3 ls s3://strawhat-tierlist-images --profile your-profile
```

2. Verify MongoDB connection:
```sh
# Inside the container
curl http://localhost:8084/api/health
```

3. Check service logs:
```sh
docker logs -f project2_cst438-01_2252-image-storage-service-1
```

4. Manual sync trigger:
```sh
curl -X POST http://localhost:8084/api/sync-s3
```

### Common Error Messages

1. "Failed to connect to MongoDB":
   - Check if MongoDB container is running
   - Verify MongoDB credentials in .env file
   - Ensure MongoDB port is accessible

2. "AWS credentials not found":
   - Check AWS credentials in .env file
   - Verify AWS region setting
   - Ensure S3 bucket exists and is accessible

3. "Image upload failed":
   - Check file size (max 10MB)
   - Verify file format (supported: jpg, png, gif)
   - Check available storage space

## Recent Updates
- Added automatic S3 to MongoDB synchronization on startup
- Improved error handling for file uploads
- Added health check endpoint
- Enhanced logging for better debugging
- Added support for multiple image formats
- Implemented retry mechanism for failed operations

## API Endpoints

### Health Check
```
GET /api/health
```

### Image Operations
```
POST /api/images/upload
GET /api/images/{id}
GET /api/images/user/{userId}
POST /api/sync-s3
```

## Future Improvements
- Add image deletion functionality
- Implement role-based access control
- Enable image processing features (resizing, watermarking)
- Improve logging and monitoring
- Add batch upload support
- Implement caching for frequently accessed images
- Add image compression options
- Support for additional storage providers

## Railway Deployment Guide for Beginners

This guide will walk you through deploying this Spring Boot application on Railway from scratch.

### What is Railway?

Railway is a modern deployment platform that makes it easy to deploy applications without worrying about infrastructure. It's like Heroku but with a more flexible approach and generous free tier.

### Prerequisites

1. **GitHub Account**: You'll need a GitHub account to connect Railway to your repository.
2. **Railway Account**: Sign up at [railway.app](https://railway.app) (you can sign up with your GitHub account).
3. **This Repository**: Make sure you have access to this repository.

### Step 1: Getting Started with Railway

1. Go to [railway.app](https://railway.app) and sign in with your GitHub account.
2. Once logged in, click on "New Project" in the dashboard.
3. Select "Deploy from GitHub repo" option.
4. Connect your GitHub account if you haven't already and select this repository.

### Step 2: Configure the Project

After selecting the repository, Railway will detect the `Dockerfile` in the project. Here's what to do next:

1. Railway will automatically detect that this is a Dockerfile project.
2. Click "Deploy" to proceed. Railway will start building and deploying your application.
3. Your application will initially deploy with default settings, which we'll customize in the next steps.

### Step 3: Setting Up Environment Variables

Your application needs certain environment variables to function correctly:

1. In your project dashboard, click on the "Variables" tab.
2. Add the following environment variables:

```
# AWS Configuration for S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_REGION=us-east-2
AWS_S3_BUCKET=your_s3_bucket_name

# MongoDB Configuration (if using Railway's MongoDB plugin)
MONGODB_URI=mongodb://username:password@host:port/database?authSource=admin

# JWT and API Authentication
JWT_SECRET=your_jwt_secret_key
API_USERNAME=admin
API_PASSWORD=your_secure_password

# Application Configuration
APP_DOMAIN=your-railway-domain.up.railway.app
ALLOWED_ORIGINS=https://your-railway-domain.up.railway.app,http://localhost:19006
```

Replace the placeholders with your actual values.

### Step 4: Add a MongoDB Database (Optional)

If you don't already have a MongoDB database, you can add one directly in Railway:

1. In your project dashboard, click "New" and select "Database".
2. Choose "MongoDB".
3. Click "Add MongoDB" to create the database.
4. Railway will automatically add the MongoDB connection variables to your project.
5. Update your `MONGODB_URI` variable to use the Railway-provided MongoDB instance.

### Step 5: Deploying Updates

To deploy updates to your application:

#### Using the Railway CLI (Recommended)

1. Install the Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Link to your project:
   ```bash
   cd image-storage-service
   railway link
   ```

4. Deploy your changes:
   ```bash
   railway up
   ```

#### Using GitHub Integration

Alternatively, you can push to GitHub and Railway will automatically deploy:

1. Make your changes to the code
2. Commit and push to GitHub
3. Railway will automatically detect the changes and start a new deployment

### Step 6: Checking Your Deployment

1. Go to the "Deployments" tab to see the status of your deployments.
2. Once deployment is complete, click on "Generate Domain" in the "Settings" tab if you don't have a domain yet.
3. Visit your application at the generated domain, e.g., `https://your-app.up.railway.app`.
4. Test the service info endpoint at `https://your-app.up.railway.app/service-info` to verify the deployment.

### Step 7: Monitoring and Logs

1. Click on the "Deployments" tab and select the latest deployment.
2. Click on "View Logs" to see the application logs.
3. Use the filter options to narrow down log entries if needed.

### Common Issues and Troubleshooting

1. **Deployment Fails**: Check your build logs for errors. Common issues include missing environment variables or build-time errors.

2. **Application Crashes**: Check the logs for runtime errors. Ensure all required environment variables are set correctly.

3. **Database Connection Issues**: Verify your MongoDB URI is correct. If using Railway's MongoDB, the connection string should be automatically configured.

4. **CORS Errors**: Ensure your `ALLOWED_ORIGINS` environment variable includes all domains that will access your API.

5. **Authentication Problems**: Check that JWT_SECRET, API_USERNAME, and API_PASSWORD are properly set.

### Using the Railway CLI for Development

The Railway CLI makes it easy to work with your Railway project locally:

1. Run your service locally with Railway environment variables:
   ```bash
   railway run ./gradlew bootRun
   ```

2. View your Railway environment variables:
   ```bash
   railway variables
   ```

3. Add a new variable:
   ```bash
   railway variables set MY_VARIABLE=value
   ```

4. Connect to your Railway MongoDB instance locally:
   ```bash
   railway run mongo
   ```

### API Authentication

This service uses JWT authentication. To authenticate:

1. Make a POST request to `/auth/login` with parameters `username` and `password`.
2. Use the returned JWT token in the Authorization header for subsequent requests: `Authorization: Bearer <token>`.

## Local Development

### Prerequisites

- Java 21
- Gradle
- Docker (optional, for local MongoDB)
- AWS account with S3 bucket

### Running Locally

1. Configure environment variables in a `.env` file (use `.env.example` as a template).
2. Run MongoDB locally:
   ```bash
   docker run -d -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=password mongo
   ```
3. Start the application:
   ```bash
   ./gradlew bootRun
   ```
4. The service will be available at http://localhost:8080

## License

[MIT](LICENSE)