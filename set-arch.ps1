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
