#!/bin/bash

# Text colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}Setting up Docker Buildx for multi-architecture builds...${NC}"

# Detect host architecture
HOST_ARCH=$(uname -m)
case "$HOST_ARCH" in
    x86_64)
        HOST_PLATFORM="linux/amd64"
        ;;
    aarch64|arm64)
        HOST_PLATFORM="linux/arm64"
        ;;
    *)
        HOST_PLATFORM="linux/amd64"
        echo -e "${YELLOW}Unknown architecture $HOST_ARCH, defaulting to amd64${NC}"
        ;;
esac

echo -e "${GREEN}Host platform detected as: $HOST_PLATFORM${NC}"

# Check for Docker installation
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed or not in PATH. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo -e "${RED}Docker daemon is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Create a new builder instance if it doesn't exist
if ! docker buildx inspect multiarch-builder &>/dev/null; then
    echo -e "${YELLOW}Creating new buildx builder instance...${NC}"
    docker buildx create --name multiarch-builder --driver docker-container --bootstrap
else
    echo -e "${GREEN}Using existing multiarch-builder instance${NC}"
    # Ensure the builder is running
    docker buildx inspect multiarch-builder | grep Status | grep "running" &>/dev/null
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}Builder exists but is not running. Bootstrapping...${NC}"
        docker buildx inspect multiarch-builder --bootstrap
    fi
fi

# Use the builder
docker buildx use multiarch-builder

# Build and push the services with multi-architecture support
build_service() {
    local service=$1
    local context=$2
    local platforms=${3:-"linux/amd64,linux/arm64"}
    local build_args=${4:-""}
    
    echo -e "\n${CYAN}Building $service for platforms: $platforms${NC}"
    
    # Check if Dockerfile exists
    if [ ! -f "$context/Dockerfile" ]; then
        echo -e "${RED}Error: Dockerfile not found in $context${NC}"
        return 1
    fi
    
    # Build the image
    docker buildx build --platform $platforms \
        $build_args \
        --tag "project2_cst438-01_2252-$service:latest" \
        --tag "project2_cst438-01_2252-$service:multiarch" \
        --file "$context/Dockerfile" \
        --load \
        "$context"
        
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Successfully built $service for multiple architectures${NC}"
    else
        echo -e "${RED}Failed to build $service${NC}"
        # Try building for host platform only if multi-platform build fails
        echo -e "${YELLOW}Attempting fallback build for host platform ($HOST_PLATFORM) only...${NC}"
        docker buildx build --platform $HOST_PLATFORM \
            $build_args \
            --tag "project2_cst438-01_2252-$service:latest" \
            --tag "project2_cst438-01_2252-$service:fallback" \
            --file "$context/Dockerfile" \
            --load \
            "$context"
            
        if [ $? -eq 0 ]; then
            echo -e "${YELLOW}Warning: Built $service for $HOST_PLATFORM only.${NC}"
            return 0
        else
            echo -e "${RED}Failed to build $service even for host platform.${NC}"
            return 1
        fi
    fi
}

# Build all services
echo -e "\n${CYAN}Building multi-architecture images for all services...${NC}"

build_service "chat-service" "./chat_api" || exit 1
build_service "auth-service" "./auth-user-service" || exit 1
build_service "tier-list-service" "./tier-list-service" || exit 1
build_service "image-storage-service" "./image-storage-service" || exit 1

# Frontend requires more memory, so we try different approaches
echo -e "\n${CYAN}Building frontend with multi-architecture support...${NC}"
if ! build_service "frontend" "./frontend" "linux/amd64,linux/arm64" "--build-arg BUILDPLATFORM=$HOST_PLATFORM"; then
    echo -e "${YELLOW}Fallback to building frontend for host platform only...${NC}"
    build_service "frontend" "./frontend" "$HOST_PLATFORM" "--build-arg BUILDPLATFORM=$HOST_PLATFORM" || exit 1
fi

echo -e "\n${GREEN}All services have been built with multi-architecture support!${NC}"
echo -e "${YELLOW}Note: You may need to update your docker-compose.yml to use the multiarch tag${NC}"

# Create a Windows PowerShell version too
cat > build-multiarch.ps1 << 'EOL'
# Text colors
$GREEN = "`e[32m"
$YELLOW = "`e[33m"
$CYAN = "`e[36m"
$RED = "`e[31m"
$NC = "`e[0m"  # No Color

Write-Host "${CYAN}Setting up Docker Buildx for multi-architecture builds...${NC}"

# Detect host architecture
$hostArch = [System.Environment]::GetEnvironmentVariable("PROCESSOR_ARCHITECTURE")
if ($hostArch -eq "AMD64") {
    $HOST_PLATFORM = "linux/amd64"
} elseif ($hostArch -eq "ARM64") {
    $HOST_PLATFORM = "linux/arm64"
} else {
    $HOST_PLATFORM = "linux/amd64"
    Write-Host "${YELLOW}Unknown architecture $hostArch, defaulting to amd64${NC}"
}

Write-Host "${GREEN}Host platform detected as: $HOST_PLATFORM${NC}"

# Check for Docker installation
try {
    docker --version | Out-Null
} catch {
    Write-Host "${RED}Docker is not installed or not in PATH. Please install Docker first.${NC}"
    exit 1
}

# Check if Docker daemon is running
try {
    docker info | Out-Null
} catch {
    Write-Host "${RED}Docker daemon is not running. Please start Docker and try again.${NC}"
    exit 1
}

# Create a new builder instance if it doesn't exist
$builderExists = docker buildx inspect multiarch-builder 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "${YELLOW}Creating new buildx builder instance...${NC}"
    docker buildx create --name multiarch-builder --driver docker-container --bootstrap
} else {
    Write-Host "${GREEN}Using existing multiarch-builder instance${NC}"
    # Ensure the builder is running
    $builderStatus = docker buildx inspect multiarch-builder
    if ($builderStatus -notmatch "Status.*running") {
        Write-Host "${YELLOW}Builder exists but is not running. Bootstrapping...${NC}"
        docker buildx inspect multiarch-builder --bootstrap
    }
}

# Use the builder
docker buildx use multiarch-builder

# Build and push the services with multi-architecture support
function Build-Service {
    param (
        [string]$service,
        [string]$context,
        [string]$platforms = "linux/amd64,linux/arm64",
        [string]$buildArgs = ""
    )
    
    Write-Host "`n${CYAN}Building $service for platforms: $platforms${NC}"
    
    # Check if Dockerfile exists
    if (-not (Test-Path "$context/Dockerfile")) {
        Write-Host "${RED}Error: Dockerfile not found in $context${NC}"
        return $false
    }
    
    # Build the image
    $buildCmd = "docker buildx build --platform $platforms $buildArgs " +
        "--tag 'project2_cst438-01_2252-$service`:latest' " +
        "--tag 'project2_cst438-01_2252-$service`:multiarch' " +
        "--file '$context/Dockerfile' " +
        "--load " +
        "'$context'"
    
    Invoke-Expression $buildCmd
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "${GREEN}Successfully built $service for multiple architectures${NC}"
        return $true
    } else {
        Write-Host "${RED}Failed to build $service${NC}"
        # Try building for host platform only if multi-platform build fails
        Write-Host "${YELLOW}Attempting fallback build for host platform ($HOST_PLATFORM) only...${NC}"
        
        $fallbackCmd = "docker buildx build --platform $HOST_PLATFORM $buildArgs " +
            "--tag 'project2_cst438-01_2252-$service`:latest' " +
            "--tag 'project2_cst438-01_2252-$service`:fallback' " +
            "--file '$context/Dockerfile' " +
            "--load " +
            "'$context'"
        
        Invoke-Expression $fallbackCmd
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "${YELLOW}Warning: Built $service for $HOST_PLATFORM only.${NC}"
            return $true
        } else {
            Write-Host "${RED}Failed to build $service even for host platform.${NC}"
            return $false
        }
    }
}

# Build all services
Write-Host "`n${CYAN}Building multi-architecture images for all services...${NC}"

if (-not (Build-Service -service "chat-service" -context "./chat_api")) { exit 1 }
if (-not (Build-Service -service "auth-service" -context "./auth-user-service")) { exit 1 }
if (-not (Build-Service -service "tier-list-service" -context "./tier-list-service")) { exit 1 }
if (-not (Build-Service -service "image-storage-service" -context "./image-storage-service")) { exit 1 }

# Frontend requires more memory, so we try different approaches
Write-Host "`n${CYAN}Building frontend with multi-architecture support...${NC}"
$frontendResult = Build-Service -service "frontend" -context "./frontend" -platforms "linux/amd64,linux/arm64" -buildArgs "--build-arg BUILDPLATFORM=$HOST_PLATFORM"

if (-not $frontendResult) {
    Write-Host "${YELLOW}Fallback to building frontend for host platform only...${NC}"
    if (-not (Build-Service -service "frontend" -context "./frontend" -platforms "$HOST_PLATFORM" -buildArgs "--build-arg BUILDPLATFORM=$HOST_PLATFORM")) { 
        exit 1 
    }
}

Write-Host "`n${GREEN}All services have been built with multi-architecture support!${NC}"
Write-Host "${YELLOW}Note: You may need to update your docker-compose.yml to use the multiarch tag${NC}"
EOL

chmod +x build-multiarch.sh
echo -e "\n${GREEN}Created both shell and PowerShell scripts for multi-architecture builds${NC}" 