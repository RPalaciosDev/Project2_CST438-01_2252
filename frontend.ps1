# Text colors
$GREEN = "`e[32m"
$YELLOW = "`e[33m"
$CYAN = "`e[36m"
$RED = "`e[31m"
$NC = "`e[0m"  # No Color
$MAGENTA = "`e[35m"

Write-Host "${CYAN}🚀 Setting up and starting Expo app...${NC}"

# Check if frontend directory exists
if (-not (Test-Path "frontend" -PathType Container)) {
    Write-Host "${RED}Error: frontend directory not found!${NC}"
    Write-Host "${YELLOW}Please make sure you're running this script from the project root directory.${NC}"
    exit 1
}

# Navigate to frontend directory
Set-Location -Path frontend

# Check if package.json exists
if (-not (Test-Path "package.json" -PathType Leaf)) {
    Write-Host "${RED}Error: package.json not found in frontend directory!${NC}"
    Write-Host "${YELLOW}Please make sure your Expo project is properly initialized.${NC}"
    exit 1
}

# Update packages to expected versions
Write-Host "`n${CYAN}📦 Updating packages to their expected versions...${NC}"

# Create a temporary file for the package update commands
$UpdatesFile = [System.IO.Path]::GetTempFileName()

@"
expo-constants@~17.0.7
expo-linking@~7.0.5
expo-router@~4.0.17
expo-secure-store@~14.0.1
expo-status-bar@~2.0.1
react@18.3.1
react-native@0.76.7
react-native-gesture-handler@~2.20.2
react-native-safe-area-context@4.12.0
react-native-screens@~4.4.0
@types/react@~18.3.12
jest-expo@~52.0.5
"@ | Out-File -FilePath $UpdatesFile -Encoding utf8

Write-Host "${GREEN}The following packages will be updated:${NC}"
Get-Content $UpdatesFile

Write-Host "`n${YELLOW}Installing updated packages... This might take a few minutes.${NC}"
$packages = (Get-Content $UpdatesFile) -join " "
npm install --legacy-peer-deps $packages

# Clean up temporary file
Remove-Item -Path $UpdatesFile

# Check for installation errors
if ($LASTEXITCODE -ne 0) {
    Write-Host "${RED}There were errors updating the packages.${NC}"
    Write-Host "${YELLOW}You may need to resolve dependencies manually.${NC}"
    exit 1
}

Write-Host "`n${GREEN}✅ Package updates completed successfully!${NC}"

# Check and install other dependencies if needed
Write-Host "`n${CYAN}🔍 Checking for other required dependencies...${NC}"
npm install --legacy-peer-deps

# Clean npm cache and node_modules if there are issues
Write-Host "`n${CYAN}🧹 Cleaning build artifacts...${NC}"
npm cache clean --force
if (Test-Path "node_modules/.cache") {
    Remove-Item -Path "node_modules/.cache" -Recurse -Force
}

# Rebuild the app
Write-Host "`n${CYAN}🔄 Rebuilding the app...${NC}"
npm install --legacy-peer-deps

# Start the Expo app
Write-Host "`n${CYAN}🚀 Starting Expo app...${NC}"
Write-Host "${YELLOW}Press Ctrl+C to stop the app${NC}"
Write-Host ""

# Launch Expo development server
npx expo start

Write-Host "`n${GREEN}✅ Expo app has been stopped.${NC}" 