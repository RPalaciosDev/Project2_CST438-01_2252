# Railway Deployment Troubleshooting Guide

## Problem: Deployment Failed for auth_user_api

Based on the build logs and previous errors, there are several approaches to resolve the deployment issues.

## Quick Fixes

### Option 1: Manual Environment Variable Update

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your `auth-user-api` project
3. Navigate to the **Variables** tab
4. Add/Update these variables:
   - `ALLOWED_ORIGINS`: `http://localhost:3000,http://localhost:19006,https://frontend-production-c2bc.up.railway.app`
   - `GOOGLE_REDIRECT_URI`: `https://frontend-production-c2bc.up.railway.app/auth/google/callback`
5. Click **Deploy** to trigger a new deployment

### Option 2: Use Simplified Deployment Script

```bash
chmod +x deploy-simple.sh
./deploy-simple.sh
```

## Deeper Fixes

### Fix Package Structure Issues

The error `The declared package "group_3.auth_user_api.controller" does not match the expected package ""` indicates a package structure mismatch.

1. Check if your source directory matches your package structure:

```
auth_user_api/src/main/java/group_3/auth_user_api/...
```

2. If directories don't match package names, either:
   - Correct the package declarations in your Java files, or
   - Move files to match the declared package structure

### Build Issues

If deployment still fails, try these steps:

1. Build the JAR locally:
```bash
cd auth_user_api
./gradlew clean bootJar --no-daemon
```

2. Check for errors in the build output
3. Fix any identified issues
4. Try deploying again

### Advanced Troubleshooting

1. Use Railway CLI's detailed deployment logs:
```bash
railway logs --service auth-user-api
```

2. Try a simpler deployment first:
```bash
# Create minimal application with just health endpoint
cd auth_user_api
# Edit src/main/java/group_3/auth_user_api/Application.java to simplify
# Rebuild and deploy
./gradlew clean bootJar
railway up --service auth-user-api
```

3. Check JVM memory limits in Railway:
   - Go to your service in Railway dashboard
   - Check "Metrics" tab for memory usage
   - If hitting limits, increase memory allocation

## CORS Verification

To verify CORS is properly configured:

```bash
curl -v -X OPTIONS \
  https://auth-user-api-production.up.railway.app/api/auth/status \
  -H "Origin: https://frontend-production-c2bc.up.railway.app" \
  -H "Access-Control-Request-Method: GET"
```

You should see `Access-Control-Allow-Origin` headers in the response.

## Railway Troubleshooting Commands

```bash
# Get detailed logs
railway logs --service auth-user-api

# SSH into the container
railway shell --service auth-user-api

# Restart the service
railway service restart --service auth-user-api

# Check environment variables
railway variables get --service auth-user-api
```

## Last Resort: Fresh Deployment

If all else fails, consider:

1. Creating a new service in Railway
2. Configuring all environment variables
3. Deploying your code to the new service 