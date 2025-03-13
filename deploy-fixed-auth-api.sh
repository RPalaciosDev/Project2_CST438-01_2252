#!/bin/bash
set -e

echo -e "\e[36m🚀 Deploying Fixed Auth User API Service\e[0m"
echo -e "\e[36m=======================================\e[0m"

# Step 1: Build the project
echo -e "\e[33m🏗️ Step 1: Building the project...\e[0m"
cd auth_user_api
chmod +x gradlew
./gradlew clean bootJar -x test

# Check if build was successful
if [ ! -f "build/libs/auth_user_api-0.0.1-SNAPSHOT.jar" ]; then
    echo -e "\e[31m❌ Build failed! Please check the errors above.\e[0m"
    exit 1
fi

echo -e "\e[32m✅ Build successful!\e[0m"

# Step 2: Deploy to Railway (if installed)
echo -e "\e[33m🚂 Step 2: Deploying to Railway...\e[0m"

# Check if Railway CLI is installed
if command -v railway &> /dev/null; then
    # Railway is installed, deploy directly
    echo -e "\e[33m🔑 Logging in to Railway (if needed)...\e[0m"
    railway login --browserless
    
    echo -e "\e[33m🚀 Deploying to Railway...\e[0m"
    railway up
    
    echo -e "\e[32m✅ Deployment initiated! Check Railway dashboard for status.\e[0m"
else
    # Railway not installed, provide manual instructions
    echo -e "\e[33m⚠️ Railway CLI not found. Manual deployment required:\e[0m"
    echo -e "  1. Install Railway CLI: npm i -g @railway/cli"
    echo -e "  2. Login: railway login"
    echo -e "  3. Deploy: railway up"
    echo -e "  Or deploy using Docker:"
    echo -e "  1. Build Docker image: docker build -t auth-user-api ."
    echo -e "  2. Push to your container registry"
    echo -e "  3. Deploy from Railway dashboard"
fi

# Step 3: Provide verification instructions
echo -e "\e[33m🔍 Step 3: Verifying deployment...\e[0m"
echo -e "Once deployed, verify your API is working with:"
echo -e "  - Status endpoint: https://your-api-url/api/auth/status"
echo -e "  - Debug endpoint: https://your-api-url/api/auth/debug"

echo -e "\e[36m=======================================\e[0m"
echo -e "\e[32m🎉 Deployment process completed!\e[0m"
echo -e "If you encounter CORS issues after deployment, check:"
echo -e "  1. Your frontend is using the correct API URL"
echo -e "  2. Your frontend domain is included in the allowed origins list"
echo -e "  3. The credentials mode is set correctly in your fetch requests"

# Return to original directory
cd .. 