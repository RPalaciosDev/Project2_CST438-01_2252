# Railway Deployment Guide for LoveTiers App

This guide will walk you through deploying the LoveTiers App to Railway.

## Prerequisites

1. A Railway account - [Sign up here](https://railway.app/)
2. Railway CLI installed - `npm install -g @railway/cli`
3. Your Google OAuth credentials for authentication
4. AWS S3 credentials for image storage
5. Git repository with your project code

## Deployment Steps

### 1. Login to Railway CLI

```bash
railway login
```

### 2. Initialize Railway Project

```bash
# Navigate to your project directory
cd lovetiers-app

# Link to a new Railway project
railway init
```

### 3. Set Up Project Variables

Set up the required environment variables:

```bash
# Set environment variables
railway variables set GOOGLE_CLIENT_ID=your_google_client_id
railway variables set GOOGLE_CLIENT_SECRET=your_google_client_secret
railway variables set MONGO_ROOT_PASSWORD=your_mongo_password
railway variables set AWS_ACCESS_KEY_ID=your_aws_key
railway variables set AWS_SECRET_ACCESS_KEY=your_aws_secret
railway variables set AWS_S3_REGION=your_aws_region
railway variables set AWS_S3_BUCKET=your_s3_bucket_name
```

### 4. Create Required Databases

Create the PostgreSQL and MongoDB instances using the Railway dashboard:

1. Go to your Railway project
2. Click "New Service" > "Database"
3. Choose PostgreSQL
4. Repeat for MongoDB

#### Linking Databases to Services

After creating the databases, you need to link them to your services:

1. Go to each service that needs database access
2. Click on "Variables" tab
3. Click "Add a Variable" > "Add from service"
4. Select the appropriate database
5. Railway will automatically add the connection variables

For PostgreSQL, these variables include:
- `DATABASE_URL`
- `PGDATABASE`
- `PGHOST`
- `PGPASSWORD`
- `PGPORT`
- `PGUSER`

For MongoDB, these variables include:
- `MONGODB_URL`

The `.railway.toml` file is configured to use these environment variables for database connections.

### 5. Deploy Your Services

Use the `.railway.toml` configuration file to deploy your services:

```bash
# Deploy all services
railway up
```

### 6. Configure Custom Domains

For each service, set up custom domains in the Railway dashboard:

1. Navigate to each service in your Railway project
2. Go to the "Settings" tab
3. Under "Domains", click "Generate Domain"
4. Optionally, configure your own custom domain

### 7. Update OAuth Redirect URIs

Update your Google OAuth configuration with the new domain:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to "APIs & Services" > "Credentials"
3. Edit your OAuth 2.0 Client ID
4. Add the new redirect URI: `https://auth.yourdomain.com/login/oauth2/code/google`

### 8. Configure CORS for Cross-Service Communication

When deploying without Nginx, CORS needs to be properly configured to allow communication between services:

1. Each service is configured to read the `ALLOWED_ORIGINS` environment variable
2. Make sure this variable is set correctly in Railway for each service
3. The value should be a comma-separated list of allowed domains, e.g.:
   ```
   https://app.yourdomain.com,https://tierlist.yourdomain.com
   ```
4. For the auth and image storage services, ensure they allow requests from the frontend domain
5. For the tier list service that communicates with the image service, ensure it's included in the image service's allowed origins

Example environment variable setup:
```bash
# For auth-service, tier-list-service, chat-service
railway variables set -s auth-service ALLOWED_ORIGINS=https://app.yourdomain.com

# For image-storage-service (allows both frontend and tier-list-service)
railway variables set -s image-storage-service ALLOWED_ORIGINS=https://app.yourdomain.com,https://tierlist.yourdomain.com
```

## Troubleshooting

### Service Connection Issues

If services can't connect to each other:

1. Check the environment variables for the correct service URLs
2. Ensure CORS is properly configured to allow cross-origin requests
3. Verify database connection strings are correctly formatted

### Database Migration Issues

If you encounter database migration issues:

1. Check the database connection strings
2. Ensure the database user has the necessary permissions
3. Run migrations manually if needed

### Frontend Not Loading

If the frontend is not loading properly:

1. Check the Railway logs for any errors
2. Verify that the environment variables are properly set
3. Test the API endpoints to ensure they're accessible

## Monitoring and Maintenance

### Health Checks

Railway monitors your services' health through their endpoints. Spring Boot services automatically include the `/actuator/health` endpoint. To verify your services are healthy:

1. Navigate to each service in your Railway dashboard
2. Check the "Deployments" tab
3. A green status indicates a healthy service
4. If a service shows as unhealthy, check its logs for errors

For custom health checks, you can configure them in the service settings:

1. Navigate to the service
2. Go to "Settings" > "Health Check"
3. Enter an appropriate health check path (e.g., `/actuator/health` for Spring services)
4. Set an appropriate check interval (e.g., 30 seconds)

### Checking Logs

```bash
# View logs for a specific service
railway logs -s frontend
```

### Updating Your Deployment

```bash
# Push changes to your deployment
git push railway main
```

### Scaling Services

Adjust the resources for your services through the Railway dashboard:

1. Navigate to the service
2. Go to the "Settings" tab
3. Adjust the CPU and RAM settings as needed

## Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Spring Boot on Railway](https://blog.railway.app/p/spring-boot)
- [Deploying React Apps on Railway](https://blog.railway.app/p/react-railway) 