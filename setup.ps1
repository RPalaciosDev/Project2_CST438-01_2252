# Text colors
$GREEN = "`e[32m"
$YELLOW = "`e[33m"
$CYAN = "`e[36m"
$RED = "`e[31m"
$NC = "`e[0m"  # No Color
$MAGENTA = "`e[35m"

Write-Host "${CYAN}Setting up LoveTiers App configuration...${NC}"

# Function to ensure directory exists
function Ensure-DirectoryExists {
    param ($Path)
    if (!(Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path | Out-Null
        Write-Host "${GREEN}Created directory: $Path${NC}"
    }
}

# Function to copy template file if destination doesn't exist
function Copy-TemplateIfNotExists {
    param ($Source, $Destination)
    if (!(Test-Path $Destination)) {
        Copy-Item -Path $Source -Destination $Destination
        Write-Host "${GREEN}Created $Destination from template${NC}"
    } else {
        Write-Host "${YELLOW}$Destination already exists, skipping...${NC}"
    }
}

# Create necessary directories
Ensure-DirectoryExists "secrets"
Ensure-DirectoryExists "nginx/ssl"
Ensure-DirectoryExists "data/postgres"
Ensure-DirectoryExists "data/mongodb"
Ensure-DirectoryExists "data/cassandra"
Ensure-DirectoryExists "data/redis"

# Copy template files
Write-Host "${CYAN}Copying template files...${NC}"
Copy-TemplateIfNotExists ".env.example" ".env"
Copy-TemplateIfNotExists "auth-user-service/src/main/resources/application.yml.example" "auth-user-service/src/main/resources/application.yml"
Copy-TemplateIfNotExists "secrets/db_password.txt.example" "secrets/db_password.txt"

# Generate random passwords and secrets
function Generate-Password {
    param ($Length = 16)
    -join ((48..57) + (65..90) + (97..122) | Get-Random -Count $Length | ForEach-Object {[char]$_})
}

$MONGO_PASSWORD = Generate-Password 16
$JWT_SECRET = Generate-Password 32
$DB_PASSWORD = Generate-Password 16
$REDIS_PASSWORD = Generate-Password 16

# Prompt for Google OAuth credentials
Write-Host "${CYAN}Google OAuth2 Setup${NC}"
$GOOGLE_CLIENT_ID = Read-Host "Google Client ID"
$GOOGLE_CLIENT_SECRET = Read-Host "Google Client Secret"

if (-not $GOOGLE_CLIENT_ID) {
    $GOOGLE_CLIENT_ID = "your_google_client_id_here"
    Write-Host "${YELLOW}Using placeholder for Google Client ID${NC}"
}
if (-not $GOOGLE_CLIENT_SECRET) {
    $GOOGLE_CLIENT_SECRET = "your_google_client_secret_here"
    Write-Host "${YELLOW}Using placeholder for Google Client Secret${NC}"
}

# Prompt for AWS S3 credentials
Write-Host "${CYAN}AWS S3 Setup${NC}"
$AWS_ACCESS_KEY_ID = Read-Host "AWS Access Key ID"
$AWS_SECRET_ACCESS_KEY = Read-Host "AWS Secret Access Key"
$AWS_S3_REGION = Read-Host "AWS S3 Region"
$AWS_S3_BUCKET = Read-Host "AWS S3 Bucket"

if (-not $AWS_ACCESS_KEY_ID) {
    $AWS_ACCESS_KEY_ID = "your_aws_access_key_id_here"
    Write-Host "${YELLOW}Using placeholder for AWS Access Key ID${NC}"
}
if (-not $AWS_SECRET_ACCESS_KEY) {
    $AWS_SECRET_ACCESS_KEY = "your_aws_secret_access_key_here"
    Write-Host "${YELLOW}Using placeholder for AWS Secret Access Key${NC}"
}
if (-not $AWS_S3_REGION) {
    $AWS_S3_REGION = "your_aws_region_here"
    Write-Host "${YELLOW}Using placeholder for AWS S3 Region${NC}"
}
if (-not $AWS_S3_BUCKET) {
    $AWS_S3_BUCKET = "your_aws_bucket_name_here"
    Write-Host "${YELLOW}Using placeholder for AWS S3 Bucket Name${NC}"
}

# Update .env file
Write-Host "${CYAN}Updating configuration files...${NC}"
$envContent = Get-Content .env
$envContent = $envContent -replace "MONGO_ROOT_PASSWORD=.*", "MONGO_ROOT_PASSWORD=$MONGO_PASSWORD"
$envContent = $envContent -replace "JWT_SECRET=.*", "JWT_SECRET=$JWT_SECRET"
$envContent = $envContent -replace "GOOGLE_CLIENT_ID=.*", "GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID"
$envContent = $envContent -replace "GOOGLE_CLIENT_SECRET=.*", "GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET"
$envContent = $envContent -replace "POSTGRES_PASSWORD=.*", "POSTGRES_PASSWORD=$DB_PASSWORD"
$envContent = $envContent -replace "AWS_ACCESS_KEY_ID=.*", "AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID"
$envContent = $envContent -replace "AWS_SECRET_ACCESS_KEY=.*", "AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY"
$envContent = $envContent -replace "AWS_S3_REGION=.*", "AWS_S3_REGION=$AWS_S3_REGION"
$envContent = $envContent -replace "AWS_S3_BUCKET=.*", "AWS_S3_BUCKET=$AWS_S3_BUCKET"

# Add Redis password to .env if it doesn't exist
if (-not ($envContent -match "REDIS_PASSWORD=")) {
    $envContent += "`n`n# Redis Configuration"
    $envContent += "`nREDIS_PASSWORD=$REDIS_PASSWORD"
    Write-Host "${GREEN}Added Redis password to .env${NC}"
} else {
    $envContent = $envContent -replace "REDIS_PASSWORD=.*", "REDIS_PASSWORD=$REDIS_PASSWORD"
}

# Add Cassandra configuration to .env if it doesn't exist
if (-not ($envContent -match "CASSANDRA_KEYSPACE=")) {
    $envContent += "`n`n# Cassandra Configuration"
    $envContent += "`nCASSANDRA_KEYSPACE=chat_keyspace"
    $envContent += "`nCASSANDRA_DATACENTER=DC1"
    Write-Host "${GREEN}Added Cassandra configuration to .env${NC}"
}

$envContent | Set-Content .env

# Update database password file
$DB_PASSWORD | Set-Content "secrets/db_password.txt"

# Create MongoDB password file if it doesn't exist
$MONGO_PASSWORD | Set-Content "secrets/mongo_password.txt"
Write-Host "${GREEN}Created MongoDB password file${NC}"

# Create Redis password file if it doesn't exist
$REDIS_PASSWORD | Set-Content "secrets/redis_password.txt" 
Write-Host "${GREEN}Created Redis password file${NC}"

# Setup frontend environment
Write-Host "${CYAN}Setting up frontend environment...${NC}"
if (Test-Path "frontend") {
    Write-Host "${GREEN}Installing required TypeScript dependencies...${NC}"
    Set-Location frontend

    # Create or update .env file for the frontend
    $FRONTEND_ENV = ".env"
    @"
EXPO_PUBLIC_API_URL=http://localhost:8081
EXPO_PUBLIC_OAUTH_REDIRECT_URI=http://localhost:8081/auth/callback
EXPO_PUBLIC_GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
"@ | Set-Content $FRONTEND_ENV

    # Install TypeScript dependencies if package.json exists
    if (Test-Path "package.json") {
        Write-Host "${GREEN}Installing TypeScript types for Node.js...${NC}"
        npm install --save-dev @types/node --legacy-peer-deps

        # Check if Tailwind is needed
        if (Select-String -Path "src/index.css", "app/index.css" -Pattern "@tailwind" -Quiet) {
            Write-Host "${GREEN}Installing Tailwind CSS dependencies...${NC}"
            npm install -D tailwindcss postcss autoprefixer --legacy-peer-deps
            npx tailwindcss init -p
        }
    } else {
        Write-Host "${YELLOW}No package.json found in frontend directory, skipping npm installs${NC}"
    }

    Set-Location ..
    Write-Host "${GREEN}Frontend environment setup completed${NC}"
} else {
    Write-Host "${YELLOW}Frontend directory not found, skipping frontend setup${NC}"
}

# Generate SSL certificates if they don't exist
Write-Host "${CYAN}Checking SSL certificates...${NC}"
if (!(Test-Path "nginx/ssl/privkey.pem") -or !(Test-Path "nginx/ssl/fullchain.pem")) {
    Write-Host "${YELLOW}Generating self-signed SSL certificates...${NC}"
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 `
        -keyout "nginx/ssl/privkey.pem" -out "nginx/ssl/fullchain.pem" `
        -subj "/CN=localhost" 2>$null
    if ($?) {
        Write-Host "${GREEN}SSL certificates generated successfully${NC}"
    } else {
        Write-Host "${RED}Failed to generate SSL certificates. Please generate them manually.${NC}"
    }
} else {
    Write-Host "${GREEN}SSL certificates already exist${NC}"
}

# Save credentials to a secure file for team reference
$CREDENTIALS_FILE = "credentials.txt"
@"
LoveTiers App Credentials
Generated on: $(Get-Date)

MongoDB Root Password: $MONGO_PASSWORD
JWT Secret: $JWT_SECRET
Database Password: $DB_PASSWORD
Redis Password: $REDIS_PASSWORD
Google Client ID: $GOOGLE_CLIENT_ID
Google Client Secret: $GOOGLE_CLIENT_SECRET
AWS Access Key ID: $AWS_ACCESS_KEY_ID
AWS Secret Access Key: $AWS_SECRET_ACCESS_KEY
AWS S3 Region: $AWS_S3_REGION
AWS S3 Bucket: $AWS_S3_BUCKET

IMPORTANT:
1. Keep this file secure and never commit it to version control
2. Share these credentials securely with team members
3. For production, use different credentials and a secure password manager
"@ | Set-Content $CREDENTIALS_FILE

Write-Host "${GREEN}✅ Setup completed successfully!${NC}"
Write-Host "${CYAN}Generated credentials have been saved to: $CREDENTIALS_FILE${NC}"
Write-Host "${MAGENTA}📋 Next steps:${NC}"
Write-Host "1. Review the generated credentials in $CREDENTIALS_FILE"
Write-Host "2. Share the credentials securely with your team members"
Write-Host "3. For production deployment, use different credentials and a secure password manager"
Write-Host "4. Start the services with: docker-compose up -d"
