# Auth User Service - Railway Deployment Guide

This guide explains how to deploy the Auth User Service to Railway.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app) if you haven't already
2. **Railway CLI**: Install the Railway CLI using `npm install -g @railway/cli`
3. **This Repository**: Make sure you have the auth-user-service code

## Deployment Steps

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

### Step 4: Set Up MongoDB

You have two options:

#### Option A: Use Railway's MongoDB Plugin

1. In the Railway dashboard, click "New" → "Database" → "MongoDB"
2. Once created, Railway will automatically add the MongoDB connection variables to your project

#### Option B: Use External MongoDB

Set the MongoDB URI manually:

```bash
railway variables set MONGODB_URI=mongodb://username:password@host:port/database?authSource=admin
```

### Step 5: Set Required Environment Variables

```bash
railway variables set JWT_SECRET=your_secure_jwt_secret_key
railway variables set GOOGLE_CLIENT_ID=your_google_oauth_client_id
railway variables set GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
railway variables set OAUTH_REDIRECT_URI=https://your-auth-service-domain.up.railway.app/login/oauth2/code/google
railway variables set ALLOWED_ORIGINS=https://your-frontend-domain.up.railway.app,http://localhost:19006
railway variables set SPRING_PROFILES_ACTIVE=prod
```

### Step 6: Deploy the Service

```bash
railway up
```

This will build and deploy your service using the Dockerfile.

### Step 7: Generate a Domain

In the Railway dashboard:
1. Go to your project
2. Select the auth-user-service
3. Go to "Settings" → "Domains"
4. Click "Generate Domain"

### Step 8: Update OAuth Redirect URIs

After deployment, update your Google OAuth console to include the new redirect URI:
`https://your-auth-service-domain.up.railway.app/login/oauth2/code/google`

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