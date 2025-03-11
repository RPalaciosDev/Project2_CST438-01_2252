# Auth User Service - Railway Deployment Guide

This guide explains how to deploy the Auth User Service to Railway.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app) if you haven't already
2. **Railway CLI**: Install the Railway CLI using `npm install -g @railway/cli`
3. **This Repository**: Make sure you have the auth-user-service code
4. **Docker**: Make sure Docker is installed on your local machine for building with the Dockerfile

## Quick Deployment through Railway UI

If you encounter issues with CLI deployment, the web UI approach is more reliable:

1. Log in to your Railway account through the browser: https://railway.app/
2. Navigate to your project 
3. Click "New Service" -> "GitHub Repo"
4. Select your repository and the auth-user-service directory
5. Once deployed, configure the environment variables (see below)
6. Generate a domain for your service in the Settings tab

## Environment Variables to Configure in Railway UI

| Variable Name | Description | Example Value | Required? |
|---------------|-------------|---------------|-----------|
| MONGODB_URI | MongoDB connection string | mongodb+srv://username:password@cluster.mongodb.net/auth_db?retryWrites=true&w=majority | ✅ Yes |
| JWT_SECRET | Secret key for JWT token signing | secure_jwt_secret_for_auth_service_438 | ✅ Yes |
| GOOGLE_CLIENT_ID | OAuth client ID from Google | 123456789-abcdef.apps.googleusercontent.com | ✅ Yes (for OAuth) |
| GOOGLE_CLIENT_SECRET | OAuth client secret from Google | GOCSPX-abcdefg123456 | ✅ Yes (for OAuth) |
| OAUTH_REDIRECT_URI | OAuth redirect URI | https://auth-service.up.railway.app/login/oauth2/code/google | ✅ Yes (for OAuth) |
| ALLOWED_ORIGINS | Comma-separated list of allowed origins for CORS | https://frontend.up.railway.app,http://localhost:19006 | ✅ Yes |
| SPRING_PROFILES_ACTIVE | Active Spring profile | prod | ✅ Yes |
| PORT | Port the service runs on | 8080 | ❌ No (set by Railway) |
| MONGO_INITDB_ROOT_USERNAME | Only if using Railway MongoDB plugin | admin | ❌ Optional |
| MONGO_INITDB_ROOT_PASSWORD | Only if using Railway MongoDB plugin | your_secure_password | ❌ Optional |

## Verifying Deployment

After deployment and configuring variables:

1. Check your service's health endpoint: `https://<your-domain>.up.railway.app/health`
2. You should see a response like:
   ```json
   {
     "status": "UP",
     "service": "auth-user-service",
     "uptime": 123456
   }
   ```

## Troubleshooting Deployment Issues

### If Deployment Fails Using CLI

Try these steps:
1. Build the JAR locally first: `./gradlew build -x test`
2. Use the Railway web UI method described above
3. Check the build logs in the Railway dashboard for specific errors

### If Application Fails to Start

Check for these common issues:
1. Missing or incorrect environment variables
2. MongoDB connection issues (check MONGODB_URI)
3. Port conflicts (Railway handles this automatically)

## Connecting with Other Services

To connect your auth service with the frontend and other services:

1. Make sure the ALLOWED_ORIGINS includes your frontend domain
2. Update your frontend code to point to the auth service URL
3. Add your auth service URL to the frontend's environment variables

## Local Deployment to Railway

The updated Dockerfile now handles the build process within Docker, so you don't need to pre-build the JAR file locally.

### Step 1: Login to Railway

```bash
railway login
```

Follow the prompts to authenticate your Railway account.

### Step 2: Navigate to the Auth User Service Directory

```bash
cd auth-user-service
```

### Step 3: Link to a Railway Project

```bash
railway link
```

If you don't have an existing project, create one:

```bash
railway project create
```

### Step 4: Set Required Environment Variables

```bash
railway variables set JWT_SECRET=your_secure_jwt_secret_key
railway variables set MONGODB_URI=mongodb://username:password@host:port/database?authSource=admin
railway variables set GOOGLE_CLIENT_ID=your_google_oauth_client_id
railway variables set GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
railway variables set OAUTH_REDIRECT_URI=https://your-auth-service-domain.up.railway.app/login/oauth2/code/google
railway variables set ALLOWED_ORIGINS=https://your-frontend-domain.up.railway.app,http://localhost:19006
railway variables set SPRING_PROFILES_ACTIVE=prod
```

### Step 5: Deploy the Service

```bash
railway up
```

This will use the multi-stage Dockerfile to build and deploy your service. The Docker build process will:
1. Use the first stage to build the application inside the Docker environment
2. Copy the resulting JAR to the runtime container
3. Deploy the application to Railway

### Step 6: Generate a Domain

In the Railway dashboard:
1. Go to your project
2. Select the auth-user-service
3. Go to "Settings" → "Domains"
4. Click "Generate Domain"

## Environment Variables Reference

| Variable Name | Description | Example Value |
|---------------|-------------|---------------|
| MONGODB_URI | MongoDB connection string | mongodb://user:pass@host:port/auth_db?authSource=admin |
| JWT_SECRET | Secret key for JWT token signing | authServiceSecretKey438 |
| GOOGLE_CLIENT_ID | OAuth client ID from Google | 123456789-abcdef.apps.googleusercontent.com |
| GOOGLE_CLIENT_SECRET | OAuth client secret from Google | GOCSPX-abcdefg123456 |
| OAUTH_REDIRECT_URI | OAuth redirect URI | https://auth-service.up.railway.app/login/oauth2/code/google |
| ALLOWED_ORIGINS | Comma-separated list of allowed origins for CORS | https://frontend.up.railway.app,http://localhost:19006 |
| SPRING_PROFILES_ACTIVE | Active Spring profile | prod |

## Troubleshooting

### Connection Issues

If the service can't connect to MongoDB:
1. Verify the MONGODB_URI variable is correctly set
2. Check if the MongoDB service is running
3. Ensure network permissions allow the connection

### Authentication Issues

If OAuth authentication is not working:
1. Verify the GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct
2. Ensure the redirect URI is properly configured in Google OAuth console
3. Check the application logs for detailed error messages

### CORS Issues

If you encounter CORS errors:
1. Make sure ALLOWED_ORIGINS includes all domains that need to access the API
2. Check for typos in domain names
3. Ensure the protocol (http/https) is correct

## Monitoring and Logs

To view the logs of your deployed service:

```bash
railway logs
```

Or via the Railway dashboard:
1. Go to your project
2. Select the auth-user-service
3. Go to "Deployments" → select your deployment → "View Logs" 