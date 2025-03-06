# Text colors
$GREEN = "`e[32m"
$YELLOW = "`e[33m"
$CYAN = "`e[36m"
$RED = "`e[31m"
$NC = "`e[0m"  # No Color

Write-Host "${CYAN}Setting up Docker Buildx for multi-architecture builds...${NC}"

# Create a new builder instance if it doesn't exist
$builderExists = docker buildx inspect multiarch-builder 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "${YELLOW}Creating new buildx builder instance...${NC}"
    docker buildx create --name multiarch-builder --driver docker-container --bootstrap
} else {
    Write-Host "${GREEN}Using existing multiarch-builder instance${NC}"
}

# Use the builder
docker buildx use multiarch-builder

# Build and push the services with multi-architecture support
function Build-Service {
    param (
        [string]$service,
        [string]$context,
        [string]$platforms = "linux/amd64,linux/arm64"
    )
    
    Write-Host "`n${CYAN}Building $service for platforms: $platforms${NC}"
    
    # Check if Dockerfile exists
    if (-not (Test-Path "$context/Dockerfile")) {
        Write-Host "${RED}Error: Dockerfile not found in $context${NC}"
        return $false
    }
    
    # Build the image with valid tag names
    docker buildx build --platform $platforms `
        --tag "project2-$service:latest" `
        --tag "project2-$service:multiarch" `
        --file "$context/Dockerfile" `
        --load `
        "$context"
        
    if ($LASTEXITCODE -eq 0) {
        Write-Host "${GREEN}Successfully built $service for multiple architectures${NC}"
        return $true
    } else {
        Write-Host "${RED}Failed to build $service${NC}"
        return $false
    }
}

# Build all services
Write-Host "`n${CYAN}Building multi-architecture images for all services...${NC}"

if (-not (Build-Service -service "chat-service" -context "./chat_api")) { exit 1 }
if (-not (Build-Service -service "auth-service" -context "./auth-user-service")) { exit 1 }
if (-not (Build-Service -service "tier-list-service" -context "./tier-list-service")) { exit 1 }
if (-not (Build-Service -service "image-storage-service" -context "./image-storage-service")) { exit 1 }

# Frontend requires more memory, so we build it separately with amd64 only initially
Write-Host "`n${CYAN}Building frontend (amd64 only for now)...${NC}"
if (-not (Build-Service -service "frontend" -context "./frontend" -platforms "linux/amd64")) { exit 1 }

Write-Host "`n${GREEN}All services have been built with multi-architecture support!${NC}"
Write-Host "${YELLOW}Note: You may need to update your docker-compose.yml to use the multiarch tag${NC}" 