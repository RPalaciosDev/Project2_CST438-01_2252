Write-Host "🚀 Deploying Fixed Auth User API Service" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# Step 1: Build the project
Write-Host "🏗️ Step 1: Building the project..." -ForegroundColor Yellow
Set-Location -Path auth_user_api
& ./gradlew clean bootJar -x test

# Check if build was successful
if (-not (Test-Path "build/libs/auth_user_api-0.0.1-SNAPSHOT.jar")) {
    Write-Host "❌ Build failed! Please check the errors above." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green

# Step 2: Deploy to Railway (if installed)
Write-Host "🚂 Step 2: Deploying to Railway..." -ForegroundColor Yellow

# Check if Railway CLI is installed
$railwayInstalled = $null
try {
    $railwayInstalled = Get-Command railway -ErrorAction SilentlyContinue
} catch {
    # Command not found
}

if ($railwayInstalled) {
    # Railway is installed, deploy directly
    Write-Host "🔑 Logging in to Railway (if needed)..." -ForegroundColor Yellow
    & railway login --browserless
    
    Write-Host "🚀 Deploying to Railway..." -ForegroundColor Yellow
    & railway up
    
    Write-Host "✅ Deployment initiated! Check Railway dashboard for status." -ForegroundColor Green
} else {
    # Railway not installed, provide manual instructions
    Write-Host "⚠️ Railway CLI not found. Manual deployment required:" -ForegroundColor Yellow
    Write-Host "  1. Install Railway CLI: npm i -g @railway/cli" -ForegroundColor White
    Write-Host "  2. Login: railway login" -ForegroundColor White
    Write-Host "  3. Deploy: railway up" -ForegroundColor White
    Write-Host "  Or deploy using Docker:" -ForegroundColor White
    Write-Host "  1. Build Docker image: docker build -t auth-user-api ." -ForegroundColor White
    Write-Host "  2. Push to your container registry" -ForegroundColor White
    Write-Host "  3. Deploy from Railway dashboard" -ForegroundColor White
}

# Step 3: Provide verification instructions
Write-Host "🔍 Step 3: Verifying deployment..." -ForegroundColor Yellow
Write-Host "Once deployed, verify your API is working with:" -ForegroundColor White
Write-Host "  - Status endpoint: https://your-api-url/api/auth/status" -ForegroundColor White
Write-Host "  - Debug endpoint: https://your-api-url/api/auth/debug" -ForegroundColor White

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "🎉 Deployment process completed!" -ForegroundColor Green
Write-Host "If you encounter CORS issues after deployment, check:" -ForegroundColor White
Write-Host "  1. Your frontend is using the correct API URL" -ForegroundColor White
Write-Host "  2. Your frontend domain is included in the allowed origins list" -ForegroundColor White
Write-Host "  3. The credentials mode is set correctly in your fetch requests" -ForegroundColor White

# Return to original directory
Set-Location -Path ".." 