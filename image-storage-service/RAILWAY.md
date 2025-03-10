# Deploying Image Storage Service to Railway

This guide explains how to deploy the image-storage-service to [Railway](https://railway.app/).

## Prerequisites

1. A Railway account
2. Railway CLI installed (optional but recommended)
3. Git repository with your image-storage-service code
4. AWS S3 bucket for image storage
5. MongoDB database (you can also deploy MongoDB on Railway)

## Setup Steps

### 1. Create a New Project on Railway

You can deploy directly from your GitHub repository or using the Railway CLI.

#### Option A: Deploy from GitHub

1. Log in to Railway
2. Create a New Project
3. Select "Deploy from GitHub repo"
4. Select your repository
5. Select the branch to deploy

#### Option B: Deploy using Railway CLI

```bash
# Login to Railway
railway login

# Initialize a new project
railway init

# Link to your existing project (if you already created one in the dashboard)
railway link

# Deploy the project
railway up
```

### 2. Configure Environment Variables

In the Railway dashboard, navigate to your project and set the following environment variables:

```
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_REGION=us-east-2
AWS_S3_BUCKET=your_s3_bucket_name
MONGO_ROOT_PASSWORD=your_mongo_password
SPRING_DATA_MONGODB_URI=mongodb://admin:your_mongo_password@your_mongodb_host:27017/image_storage_db?authSource=admin
SPRING_PROFILES_ACTIVE=prod
```

### 3. Deploy MongoDB on Railway (Optional)

If you don't have a MongoDB database, you can deploy one on Railway:

1. In your project, click "New"
2. Select "Database"
3. Choose "MongoDB"
4. After creation, get the connection details from Variables
5. Update your `SPRING_DATA_MONGODB_URI` with the correct connection string

### 4. Verify Deployment

1. Go to the deployments tab to see deployment logs
2. Once deployed, click on the "Domains" tab to find your service URL
3. Test your service by accessing the `/api/info` endpoint:

```bash
curl https://your-service-url.railway.app/api/info
```

### 5. Custom Domain (Optional)

1. Go to the "Domains" tab
2. Click "Custom Domain"
3. Follow the steps to configure your custom domain

## Troubleshooting

- Check deployment logs for any errors
- Verify environment variables are correctly set
- Ensure your MongoDB is accessible from Railway
- Check that your AWS S3 bucket has the correct permissions

## Continuous Deployment

Railway supports automatic deployments whenever you push to your GitHub repository. This feature is enabled by default when you deploy from GitHub. 