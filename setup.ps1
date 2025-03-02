# Setup script for LoveTiers App
Write-Host "🚀 Setting up LoveTiers App configuration..." -ForegroundColor Cyan

# Function to ensure directory exists
function EnsureDirectoryExists($path) {
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path | Out-Null
        Write-Host "Created directory: $path" -ForegroundColor Green
    }
}

# Function to copy template file if destination doesn't exist
function CopyTemplateIfNotExists($source, $destination) {
    if (-not (Test-Path $destination)) {
        Copy-Item $source $destination
        Write-Host "Created $destination from template" -ForegroundColor Green
    } else {
        Write-Host "$destination already exists, skipping..." -ForegroundColor Yellow
    }
}

# Create necessary directories
EnsureDirectoryExists "secrets"
EnsureDirectoryExists "nginx/ssl"

# Copy template files
Write-Host "`n📝 Copying template files..." -ForegroundColor Cyan
CopyTemplateIfNotExists ".env.example" ".env"
CopyTemplateIfNotExists "auth-user-service/src/main/resources/application.yml.example" "auth-user-service/src/main/resources/application.yml"
CopyTemplateIfNotExists "secrets/db_password.txt.example" "secrets/db_password.txt"

# Generate random passwords and secrets
$mongoPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_})
$jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
$dbPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_})

# Prompt for Google OAuth credentials
Write-Host "`n🔑 Google OAuth2 Setup" -ForegroundColor Cyan
Write-Host "Please enter your Google OAuth2 credentials (or press Enter to use placeholders):"
$googleClientId = Read-Host "Google Client ID"
$googleClientSecret = Read-Host "Google Client Secret"

if ([string]::IsNullOrWhiteSpace($googleClientId)) {
    $googleClientId = "your_google_client_id_here"
    Write-Host "Using placeholder for Google Client ID" -ForegroundColor Yellow
}
if ([string]::IsNullOrWhiteSpace($googleClientSecret)) {
    $googleClientSecret = "your_google_client_secret_here"
    Write-Host "Using placeholder for Google Client Secret" -ForegroundColor Yellow
}

# Update .env file
Write-Host "`n📝 Updating configuration files..." -ForegroundColor Cyan
$envContent = Get-Content ".env" -Raw
$envContent = $envContent -replace "MONGO_ROOT_PASSWORD=.*", "MONGO_ROOT_PASSWORD=$mongoPassword"
$envContent = $envContent -replace "JWT_SECRET=.*", "JWT_SECRET=$jwtSecret"
$envContent = $envContent -replace "GOOGLE_CLIENT_ID=.*", "GOOGLE_CLIENT_ID=$googleClientId"
$envContent = $envContent -replace "GOOGLE_CLIENT_SECRET=.*", "GOOGLE_CLIENT_SECRET=$googleClientSecret"
$envContent = $envContent -replace "POSTGRES_PASSWORD=.*", "POSTGRES_PASSWORD=$dbPassword"
$envContent | Set-Content ".env"

# Update database password file
$dbPassword | Set-Content "secrets/db_password.txt"

# Generate SSL certificates if they don't exist
Write-Host "`n🔒 Checking SSL certificates..." -ForegroundColor Cyan
if (-not (Test-Path "nginx/ssl/privkey.pem") -or -not (Test-Path "nginx/ssl/fullchain.pem")) {
    Write-Host "Generating self-signed SSL certificates..." -ForegroundColor Yellow
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 `
        -keyout nginx/ssl/privkey.pem -out nginx/ssl/fullchain.pem `
        -subj "/CN=localhost" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SSL certificates generated successfully" -ForegroundColor Green
    } else {
        Write-Host "Failed to generate SSL certificates. Please generate them manually." -ForegroundColor Red
    }
} else {
    Write-Host "SSL certificates already exist" -ForegroundColor Green
}

# Save credentials to a secure file for team reference
$credentialsFile = "credentials.txt"
@"
🔐 LoveTiers App Credentials
Generated on: $(Get-Date)

MongoDB Root Password: $mongoPassword
JWT Secret: $jwtSecret
Database Password: $dbPassword
Google Client ID: $googleClientId
Google Client Secret: $googleClientSecret

⚠️ IMPORTANT:
1. Keep this file secure and never commit it to version control
2. Share these credentials securely with team members
3. For production, use different credentials and a secure password manager
"@ | Set-Content $credentialsFile

Write-Host "`n✅ Setup completed successfully!" -ForegroundColor Green
Write-Host "Generated credentials have been saved to: $credentialsFile" -ForegroundColor Cyan
Write-Host "`n📋 Next steps:" -ForegroundColor Magenta
Write-Host "1. Review the generated credentials in $credentialsFile"
Write-Host "2. Share the credentials securely with your team members"
Write-Host "3. For production deployment, use different credentials and a secure password manager"
Write-Host "4. Start the services with: docker-compose up -d" 