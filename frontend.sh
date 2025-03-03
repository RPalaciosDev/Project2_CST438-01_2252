#!/bin/bash

# Text colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color
MAGENTA='\033[0;35m'

echo -e "${CYAN}🚀 Setting up and starting Expo app...${NC}"

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    echo -e "${RED}Error: frontend directory not found!${NC}"
    echo -e "${YELLOW}Please make sure you're running this script from the project root directory.${NC}"
    exit 1
fi

# Navigate to frontend directory
cd frontend

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found in frontend directory!${NC}"
    echo -e "${YELLOW}Please make sure your Expo project is properly initialized.${NC}"
    exit 1
fi

# Update packages to expected versions
echo -e "\n${CYAN}📦 Updating packages to their expected versions...${NC}"

# Create a temporary file for the package update commands
UPDATES_FILE=$(mktemp)

cat > "$UPDATES_FILE" << EOL
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
EOL

echo -e "${GREEN}The following packages will be updated:${NC}"
cat "$UPDATES_FILE"

echo -e "\n${YELLOW}Installing updated packages... This might take a few minutes.${NC}"
npm install --legacy-peer-deps $(cat "$UPDATES_FILE")

# Clean up temporary file
rm "$UPDATES_FILE"

# Check for installation errors
if [ $? -ne 0 ]; then
    echo -e "${RED}There were errors updating the packages.${NC}"
    echo -e "${YELLOW}You may need to resolve dependencies manually.${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ Package updates completed successfully!${NC}"

# Check and install other dependencies if needed
echo -e "\n${CYAN}🔍 Checking for other required dependencies...${NC}"
npm install --legacy-peer-deps

# Clean npm cache and node_modules if there are issues
echo -e "\n${CYAN}🧹 Cleaning build artifacts...${NC}"
npm cache clean --force
rm -rf node_modules/.cache

# Rebuild the app
echo -e "\n${CYAN}🔄 Rebuilding the app...${NC}"
npm install --legacy-peer-deps

# Start the Expo app
echo -e "\n${CYAN}🚀 Starting Expo app...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the app${NC}"
echo ""

# Launch Expo development server
npx expo start

echo -e "\n${GREEN}✅ Expo app has been stopped.${NC}"
