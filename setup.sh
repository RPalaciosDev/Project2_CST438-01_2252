#!/bin/bash

# Text colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color
MAGENTA='\033[0;35m'

echo -e "${CYAN}🚀 Setting up LoveTiers App configuration...${NC}"

# Function to ensure directory exists
ensure_directory_exists() {
    if [ ! -d "$1" ]; then
        mkdir -p "$1"
        echo -e "${GREEN}Created directory: $1${NC}"
    fi
}

# Function to copy template file if destination doesn't exist
copy_template_if_not_exists() {
    if [ ! -f "$2" ]; then
        cp "$1" "$2"
        echo -e "${GREEN}Created $2 from template${NC}"
    else
        echo -e "${YELLOW}$2 already exists, skipping...${NC}"
    fi
}

# Create necessary directories
ensure_directory_exists "secrets"
ensure_directory_exists "nginx/ssl"

# Copy template files
echo -e "\n${CYAN}📝 Copying template files...${NC}"
copy_template_if_not_exists ".env.example" ".env"
copy_template_if_not_exists "auth-user-service/src/main/resources/application.yml.example" "auth-user-service/src/main/resources/application.yml"
copy_template_if_not_exists "secrets/db_password.txt.example" "secrets/db_password.txt"

# Generate random passwords and secrets
generate_password() {
    tr -dc 'A-Za-z0-9' < /dev/urandom | head -c ${1:-16}
}

MONGO_PASSWORD=$(generate_password 16)
JWT_SECRET=$(generate_password 32)
DB_PASSWORD=$(generate_password 16)

# Prompt for Google OAuth credentials
echo -e "\n${CYAN}🔑 Google OAuth2 Setup${NC}"
echo "Please enter your Google OAuth2 credentials (or press Enter to use placeholders):"
read -p "Google Client ID: " GOOGLE_CLIENT_ID
read -p "Google Client Secret: " GOOGLE_CLIENT_SECRET

if [ -z "$GOOGLE_CLIENT_ID" ]; then
    GOOGLE_CLIENT_ID="your_google_client_id_here"
    echo -e "${YELLOW}Using placeholder for Google Client ID${NC}"
fi
if [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    GOOGLE_CLIENT_SECRET="your_google_client_secret_here"
    echo -e "${YELLOW}Using placeholder for Google Client Secret${NC}"
fi

# Prompt for AWS S3 credentials
echo -e "\n${CYAN}☁️ AWS S3 Setup${NC}"
echo "Please enter your AWS S3 credentials (or press Enter to use placeholders):"
read -p "AWS Access Key ID: " AWS_ACCESS_KEY_ID
read -p "AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
read -p "AWS S3 Region: " AWS_S3_REGION
read -p "AWS S3 Bucket Name: " AWS_S3_BUCKET

if [ -z "$AWS_ACCESS_KEY_ID" ]; then
    AWS_ACCESS_KEY_ID="your_aws_access_key_id_here"
    echo -e "${YELLOW}Using placeholder for AWS Access Key ID${NC}"
fi
if [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    AWS_SECRET_ACCESS_KEY="your_aws_secret_access_key_here"
    echo -e "${YELLOW}Using placeholder for AWS Secret Access Key${NC}"
fi
if [ -z "$AWS_S3_REGION" ]; then
    AWS_S3_REGION="your_aws_region_here"
    echo -e "${YELLOW}Using placeholder for AWS S3 Region${NC}"
fi
if [ -z "$AWS_S3_BUCKET" ]; then
    AWS_S3_BUCKET="your_aws_bucket_name_here"
    echo -e "${YELLOW}Using placeholder for AWS S3 Bucket Name${NC}"
fi

# Update .env file
echo -e "\n${CYAN}📝 Updating configuration files...${NC}"
sed -i.bak "s/MONGO_ROOT_PASSWORD=.*/MONGO_ROOT_PASSWORD=$MONGO_PASSWORD/" .env
sed -i.bak "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
sed -i.bak "s/GOOGLE_CLIENT_ID=.*/GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID/" .env
sed -i.bak "s/GOOGLE_CLIENT_SECRET=.*/GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET/" .env
sed -i.bak "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$DB_PASSWORD/" .env
sed -i.bak "s/AWS_ACCESS_KEY_ID=.*/AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID/" .env
sed -i.bak "s/AWS_SECRET_ACCESS_KEY=.*/AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY/" .env
sed -i.bak "s/AWS_S3_REGION=.*/AWS_S3_REGION=$AWS_S3_REGION/" .env
sed -i.bak "s/AWS_S3_BUCKET=.*/AWS_S3_BUCKET=$AWS_S3_BUCKET/" .env
rm .env.bak

# Update database password file
echo "$DB_PASSWORD" > secrets/db_password.txt

# Setup frontend environment
echo -e "\n${CYAN}🌐 Setting up frontend environment...${NC}"
if [ -d "frontend" ]; then
    echo -e "${GREEN}Installing required TypeScript dependencies...${NC}"
    cd frontend
    
    # Create or update .env file for the frontend
    FRONTEND_ENV=".env"
    echo "EXPO_PUBLIC_API_URL=http://localhost:8081" > $FRONTEND_ENV
    echo "EXPO_PUBLIC_OAUTH_REDIRECT_URI=http://localhost:8081/auth/callback" >> $FRONTEND_ENV
    echo "EXPO_PUBLIC_GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID" >> $FRONTEND_ENV
    
    # Install required TypeScript dependencies if package.json exists
    if [ -f "package.json" ]; then
        echo -e "${GREEN}Installing TypeScript types for Node.js...${NC}"
        npm install --save-dev @types/node --legacy-peer-deps
        
        # Check if we need to install Tailwind dependencies
        if grep -q "@tailwind" "src/index.css" 2>/dev/null || grep -q "@tailwind" "app/index.css" 2>/dev/null; then
            echo -e "${GREEN}Installing Tailwind CSS dependencies...${NC}"
            npm install -D tailwindcss postcss autoprefixer --legacy-peer-deps
            npx tailwindcss init -p
        fi
    else
        echo -e "${YELLOW}No package.json found in frontend directory, skipping npm installs${NC}"
    fi
    
    cd ..
    echo -e "${GREEN}Frontend environment setup completed${NC}"
else
    echo -e "${YELLOW}Frontend directory not found, skipping frontend setup${NC}"
fi

# Generate SSL certificates if they don't exist
echo -e "\n${CYAN}🔒 Checking SSL certificates...${NC}"
if [ ! -f "nginx/ssl/privkey.pem" ] || [ ! -f "nginx/ssl/fullchain.pem" ]; then
    echo -e "${YELLOW}Generating self-signed SSL certificates...${NC}"
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/privkey.pem -out nginx/ssl/fullchain.pem \
        -subj "/CN=localhost" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}SSL certificates generated successfully${NC}"
    else
        echo -e "${RED}Failed to generate SSL certificates. Please generate them manually.${NC}"
    fi
else
    echo -e "${GREEN}SSL certificates already exist${NC}"
fi

# Save credentials to a secure file for team reference
CREDENTIALS_FILE="credentials.txt"
cat > "$CREDENTIALS_FILE" << EOL
🔐 LoveTiers App Credentials
Generated on: $(date)

MongoDB Root Password: $MONGO_PASSWORD
JWT Secret: $JWT_SECRET
Database Password: $DB_PASSWORD
Google Client ID: $GOOGLE_CLIENT_ID
Google Client Secret: $GOOGLE_CLIENT_SECRET
AWS Access Key ID: $AWS_ACCESS_KEY_ID
AWS Secret Access Key: $AWS_SECRET_ACCESS_KEY
AWS S3 Region: $AWS_S3_REGION
AWS S3 Bucket: $AWS_S3_BUCKET

⚠️ IMPORTANT:
1. Keep this file secure and never commit it to version control
2. Share these credentials securely with team members
3. For production, use different credentials and a secure password manager
EOL

echo -e "\n${GREEN}✅ Setup completed successfully!${NC}"
echo -e "${CYAN}Generated credentials have been saved to: $CREDENTIALS_FILE${NC}"
echo -e "\n${MAGENTA}📋 Next steps:${NC}"
echo "1. Review the generated credentials in $CREDENTIALS_FILE"
echo "2. Share the credentials securely with your team members"
echo "3. For production deployment, use different credentials and a secure password manager"
echo "4. Start the services with: docker-compose up -d"

# Create a new cross-platform script (setup.js) using Node.js
const fs = require('fs');
const path = require('path');
const os = require('os');

# Use path.join for cross-platform paths
const configPath = path.join(__dirname, 'config'); 