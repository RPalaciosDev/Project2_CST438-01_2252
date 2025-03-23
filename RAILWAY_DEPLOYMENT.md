# Railway Deployment Guide

This guide provides instructions for deploying each microservice of the LoveTiers application to Railway.

## Table of Contents

- [Introduction to Railway](#introduction-to-railway)
- [Getting Started](#getting-started)
- [General Deployment Process](#general-deployment-process)
- [Service-Specific Deployment](#service-specific-deployment)
  - [Frontend Service](#frontend-service)
  - [Auth User Service](#auth-user-service)
  - [Tier List Service](#tier-list-service)
  - [Chat Service](#chat-service)
  - [Image Storage Service](#image-storage-service)
  - [ML Service](#ml-service)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Custom Domains and SSL](#custom-domains-and-ssl)
- [Monitoring and Logs](#monitoring-and-logs)
- [Troubleshooting](#troubleshooting)

## Introduction to Railway

Railway is a deployment platform that makes it simple to deploy applications and databases. It handles infrastructure management, scaling, and CI/CD pipelines.

Key benefits:

- No infrastructure management required
- Automatic deployments from Git
- Environment variable management
- Database provisioning
- Monitoring and logging
- Custom domains with automatic SSL

## Getting Started

1. **Create a Railway Account**
   - Sign up at [Railway.app](https://railway.app/)
   - Connect your GitHub account for easy deployment

2. **Install Railway CLI (Optional)**

   ```bash
   npm i -g @railway/cli
   railway login
   ```

3. **Understand Railway Projects**
   - Each microservice will be deployed as a separate Railway project
   - Projects can contain multiple services (web servers, databases, etc.)
   - Services within a project can communicate via internal networking

## General Deployment Process

Each microservice follows this deployment process:

1. **Create a New Project**
   - From the Railway dashboard, click "New Project"
   - Select "Deploy from GitHub repo"

2. **Connect Repository**
   - Select your GitHub repository
   - Set the appropriate subdirectory (e.g., `/frontend` or `/auth_user_api`)

3. **Configure Build Settings**
   - Railway will auto-detect settings for most services
   - You can customize build commands and start commands if needed

4. **Set Environment Variables**
   - Add service-specific environment variables
   - Connect to other services (databases, etc.)

5. **Deploy the Service**
   - Railway will automatically build and deploy your service
   - Monitor logs for any build or startup issues

6. **Set Up Custom Domain (Optional)**
   - Add a custom domain in the project settings
   - Configure DNS records as instructed
   - Railway will handle SSL certificate generation

## Service-Specific Deployment

### Frontend Service

**Directory**: `frontend/`

**Build Settings**:

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**Environment Variables**:

```
NODE_ENV=production
AUTH_API_URL=https://your-auth-service-url
TIERLIST_API_URL=https://your-tierlist-service-url
CHAT_API_URL=https://your-chat-service-url
IMAGE_API_URL=https://your-image-service-url
ML_SERVICE_URL=https://your-ml-service-url
```

**Notes**:

- Ensure all backend service URLs are correctly set in environment variables
- For Expo/React Native projects, Railway will serve the web build

### Auth User Service

**Directory**: `auth_user_api/`

**Build Settings**:

- Railway should auto-detect Java/Spring Boot settings

**Environment Variables**:

```
SPRING_PROFILES_ACTIVE=prod
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_SECRET=your-secure-jwt-secret-key
MONGO_URI=your-mongodb-connection-string
ALLOWED_ORIGINS=https://your-frontend-url
FRONTEND_URL=https://your-frontend-url
```

**Database Setup**:

1. Create a MongoDB service in your Railway project
2. Railway will automatically provide the connection string as an environment variable
3. Use this connection string in your `MONGO_URI` variable

### Tier List Service

**Directory**: `tier-list-service/`

**Build Settings**:

- Railway should auto-detect Java/Spring Boot settings

**Environment Variables**:

```
SPRING_PROFILES_ACTIVE=prod
MONGO_URI=your-mongodb-connection-string
ALLOWED_ORIGINS=https://your-frontend-url
AUTH_SERVICE_URL=https://your-auth-service-url
IMAGE_SERVICE_URL=https://your-image-service-url
```

**Database Setup**:

1. Create a MongoDB service in your Railway project
2. Railway will automatically provide the connection string as an environment variable
3. Use this connection string in your `MONGO_URI` variable

### Chat Service

**Directory**: `chat_api/`

**Build Settings**:

- Railway should auto-detect Java/Spring Boot settings

**Environment Variables**:

```
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=jdbc:postgresql://your-postgres-host:5432/chat_db
SPRING_DATASOURCE_USERNAME=postgres-username
SPRING_DATASOURCE_PASSWORD=postgres-password
ALLOWED_ORIGINS=https://your-frontend-url
```

**Database Setup**:

1. Create a PostgreSQL service in your Railway project
2. Railway will automatically provide the connection details as environment variables
3. Use these details in your database configuration

### Image Storage Service

**Directory**: `image-storage-service/`

**Build Settings**:

- Railway should auto-detect Java/Spring Boot settings

**Environment Variables**:

```
SPRING_PROFILES_ACTIVE=prod
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_REGION=your-aws-region
AWS_S3_BUCKET=your-s3-bucket-name
MONGO_URI=your-mongodb-connection-string
ALLOWED_ORIGINS=https://your-frontend-url
```

**Storage Setup**:

1. Create an AWS S3 bucket for image storage
2. Set up IAM credentials with appropriate S3 access
3. Create a MongoDB service in Railway for metadata storage

### ML Service

**Directory**: `ml-service/`

**Build Settings**:

- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python app.py` (adjust to your main file)

**Environment Variables**:

```
FLASK_ENV=production
MODEL_PATH=/app/models
DEBUG=false
```

**Notes**:

- Ensure your `requirements.txt` file includes all necessary dependencies
- Adjust the start command based on your main Python file
- For machine learning models, consider using Railway volumes for persistent storage

## Environment Variables

Railway provides a secure way to manage environment variables:

1. **Project-Level Variables**:
   - Set in the project settings
   - Shared across all services in the project

2. **Service-Level Variables**:
   - Set in the service settings
   - Override project-level variables

3. **Variable References**:
   - You can reference other variables: `${VARIABLE_NAME}`
   - Useful for sharing values between services

4. **Secrets Management**:
   - All environment variables are encrypted at rest
   - Never commit sensitive values to your repository

## Database Setup

Railway provides managed database services:

1. **Creating a Database**:
   - From your project, click "New Service"
   - Select the database type (MongoDB, PostgreSQL, MySQL, Redis)
   - Railway will provision a database with connection details

2. **Accessing Connection Details**:
   - Connection details are automatically injected as environment variables
   - For PostgreSQL:
     - `PGHOST`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `PGPORT`
   - For MongoDB:
     - `MONGODB_URL`

3. **Database Migration**:
   - For services that require initialization or migration:
     - Add migration scripts to your repository
     - Configure your application to run migrations on startup

## Custom Domains and SSL

Configure custom domains for your services:

1. **Adding a Domain**:
   - Go to your service settings
   - Click "Custom Domain"
   - Enter your domain name

2. **DNS Configuration**:
   - Add the CNAME record provided by Railway to your DNS provider
   - Point to the provided Railway domain

3. **SSL Certificates**:
   - Railway automatically provisions SSL certificates
   - Certificates are automatically renewed
   - No manual configuration required

## Monitoring and Logs

Railway provides monitoring and logging tools:

1. **Logs**:
   - Access real-time logs in the service dashboard
   - Filter logs by service or time period
   - Search for specific log entries

2. **Metrics**:
   - View CPU, memory, and network usage
   - Monitor service uptime and response times

3. **Alerts**:
   - Set up alerts for service failures
   - Receive notifications via email or Slack

## Troubleshooting

Common issues and solutions:

### Build Failures

1. **Missing Dependencies**:
   - Check your build logs for missing dependencies
   - Ensure your package.json, requirements.txt, or build.gradle files are correct
   - For Java services, check Gradle or Maven configuration

2. **Environment Configuration**:
   - Verify required environment variables are set
   - Check for typos in variable names

3. **Resource Limits**:
   - Railway has resource limits for build processes
   - Large builds might need optimization

### Runtime Errors

1. **Service Crashes**:
   - Check logs for error messages
   - Verify all required environment variables
   - Ensure databases are properly connected

2. **Network Issues**:
   - Check if services can communicate with each other
   - Verify correct URLs for service-to-service communication
   - For external services, check API keys and access permissions

3. **Database Connectivity**:
   - Verify connection strings
   - Check database user permissions
   - Ensure your database service is running

### Deployment Delays

1. **Build Queue**:
   - Railway builds might be queued during high load
   - Check the deployment status in dashboard

2. **Large Repositories**:
   - Large codebases might take longer to clone and build
   - Consider optimizing your repository size

3. **Dependency Installation**:
   - Large dependency trees can slow down builds
   - Consider using dependency caching if available

If issues persist, contact Railway support through their dashboard or check their documentation for specific error messages.
