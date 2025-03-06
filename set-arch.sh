#!/bin/bash

# Text colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}Detecting and setting architecture variables for Docker...${NC}"

# Detect host architecture
HOST_ARCH=$(uname -m)
case "$HOST_ARCH" in
    x86_64)
        BUILDPLATFORM="linux/amd64"
        TARGETPLATFORM="linux/amd64"
        echo -e "${GREEN}Detected x86_64/AMD64 architecture.${NC}"
        ;;
    aarch64|arm64)
        BUILDPLATFORM="linux/arm64"
        TARGETPLATFORM="linux/arm64"
        echo -e "${GREEN}Detected ARM64 architecture.${NC}"
        ;;
    *)
        BUILDPLATFORM="linux/amd64"
        TARGETPLATFORM="linux/amd64"
        echo -e "${YELLOW}Unknown architecture $HOST_ARCH, defaulting to amd64${NC}"
        ;;
esac

# Create or update .env file with architecture variables
if [ -f .env ]; then
    # Remove existing architecture variables if present
    grep -v "^BUILDPLATFORM=" .env > .env.tmp
    grep -v "^TARGETPLATFORM=" .env.tmp > .env.new
    mv .env.new .env.tmp
    
    # Add new architecture variables
    echo "BUILDPLATFORM=$BUILDPLATFORM" >> .env.tmp
    echo "TARGETPLATFORM=$TARGETPLATFORM" >> .env.tmp
    
    mv .env.tmp .env
    echo -e "${GREEN}Updated .env file with architecture variables.${NC}"
else
    echo "BUILDPLATFORM=$BUILDPLATFORM" > .env
    echo "TARGETPLATFORM=$TARGETPLATFORM" >> .env
    echo -e "${YELLOW}Created new .env file with architecture variables.${NC}"
    echo -e "${YELLOW}Note: You might want to add other required environment variables to this file.${NC}"
fi

echo -e "\n${GREEN}Architecture variables set:${NC}"
echo -e "  BUILDPLATFORM=$BUILDPLATFORM"
echo -e "  TARGETPLATFORM=$TARGETPLATFORM"

echo -e "\n${CYAN}Creating Windows PowerShell version...${NC}"

# Create a Windows PowerShell version too
cat > set-arch.ps1 << 'EOL'
# Text colors
$GREEN = "`e[32m"
$YELLOW = "`e[33m"
$CYAN = "`e[36m"
$RED = "`e[31m"
$NC = "`e[0m"  # No Color

Write-Host "${CYAN}Detecting and setting architecture variables for Docker...${NC}"

# Detect host architecture
$hostArch = [System.Environment]::GetEnvironmentVariable("PROCESSOR_ARCHITECTURE")
if ($hostArch -eq "AMD64") {
    $BUILDPLATFORM = "linux/amd64"
    $TARGETPLATFORM = "linux/amd64"
    Write-Host "${GREEN}Detected x86_64/AMD64 architecture.${NC}"
} elseif ($hostArch -eq "ARM64") {
    $BUILDPLATFORM = "linux/arm64"
    $TARGETPLATFORM = "linux/arm64"
    Write-Host "${GREEN}Detected ARM64 architecture.${NC}"
} else {
    $BUILDPLATFORM = "linux/amd64"
    $TARGETPLATFORM = "linux/amd64"
    Write-Host "${YELLOW}Unknown architecture $hostArch, defaulting to amd64${NC}"
}

# Create or update .env file with architecture variables
if (Test-Path .env) {
    # Read all lines except architecture variables
    $envContent = Get-Content .env | Where-Object { !$_.StartsWith("BUILDPLATFORM=") -and !$_.StartsWith("TARGETPLATFORM=") }
    
    # Add architecture variables
    $envContent += "BUILDPLATFORM=$BUILDPLATFORM"
    $envContent += "TARGETPLATFORM=$TARGETPLATFORM"
    
    # Write back to .env
    $envContent | Set-Content -Path .env -Encoding UTF8
    Write-Host "${GREEN}Updated .env file with architecture variables.${NC}"
} else {
    # Create new .env with just architecture variables
    "BUILDPLATFORM=$BUILDPLATFORM" | Set-Content -Path .env -Encoding UTF8
    "TARGETPLATFORM=$TARGETPLATFORM" | Add-Content -Path .env -Encoding UTF8
    Write-Host "${YELLOW}Created new .env file with architecture variables.${NC}"
    Write-Host "${YELLOW}Note: You might want to add other required environment variables to this file.${NC}"
}

Write-Host "`n${GREEN}Architecture variables set:${NC}"
Write-Host "  BUILDPLATFORM=$BUILDPLATFORM"
Write-Host "  TARGETPLATFORM=$TARGETPLATFORM"
EOL

chmod +x set-arch.sh
chmod +x set-arch.ps1

echo -e "\n${GREEN}Created both shell and PowerShell scripts for setting architecture variables${NC}"
echo -e "${CYAN}To use these variables, run:${NC}"
echo -e "  ${YELLOW}On macOS/Linux: ${GREEN}source ./set-arch.sh${NC}"
echo -e "  ${YELLOW}On Windows: ${GREEN}. ./set-arch.ps1${NC}" 