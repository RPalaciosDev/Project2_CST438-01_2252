# Frontend Application

## Setup and Development

### Quick Start

Run the frontend setup script from the project root:

```bash
chmod +x frontend.sh
./frontend.sh
```

This script:
1. Updates all Expo packages to their compatible versions
2. Installs required dependencies
3. Cleans build artifacts if necessary
4. Launches the Expo development server

### Package Version Compatibility

The `frontend.sh` script updates these packages to their expected versions:

| Package | Current Version | Expected Version |
|---------|----------------|-----------------|
| expo-constants | 15.4.6 | ~17.0.7 |
| expo-linking | 6.2.2 | ~7.0.5 |
| expo-router | 3.5.24 | ~4.0.17 |
| expo-secure-store | 12.8.1 | ~14.0.1 |
| expo-status-bar | 1.11.1 | ~2.0.1 |
| react | 18.2.0 | 18.3.1 |
| react-native | 0.73.11 | 0.76.7 |
| react-native-gesture-handler | 2.14.1 | ~2.20.2 |
| react-native-safe-area-context | 4.8.2 | 4.12.0 |
| react-native-screens | 3.29.0 | ~4.4.0 |
| @types/react | 18.2.79 | ~18.3.12 |
| jest-expo | 50.0.4 | ~52.0.5 |

### Manual Setup (if needed)

If you need to manually update packages:

```bash
cd frontend
npm install --legacy-peer-deps expo-constants@~17.0.7 expo-linking@~7.0.5 expo-router@~4.0.17 expo-secure-store@~14.0.1 expo-status-bar@~2.0.1 react@18.3.1 react-native@0.76.7 react-native-gesture-handler@~2.20.2 react-native-safe-area-context@4.12.0 react-native-screens@~4.4.0 @types/react@~18.3.12 jest-expo@~52.0.5
```

If you encounter build issues, try cleaning the cache:

```bash
npm cache clean --force
rm -rf node_modules/.cache
npm install --legacy-peer-deps
```

## Recent Updates

### 🛠 TypeScript Configuration Fixes

Resolved several TypeScript issues:

- Added `node` to the types field in `tsconfig.json` to resolve the "Cannot find name 'process'" error
- This allows proper typing for Node.js globals like `process.env` when using environment variables

### 🎨 Tailwind CSS Integration

Fixed the "Unknown at rule @tailwind" error by properly configuring Tailwind CSS:

- Added required dependencies: `tailwindcss`, `postcss`, and `autoprefixer`
- Created configuration files: `tailwind.config.js` and `postcss.config.js`
- Ensured proper directive usage: `@tailwind base`, `@tailwind components`, `@tailwind utilities`

### 🔧 Environment Variables

Improved environment variable handling:

- Using Expo's environment variable system with `EXPO_PUBLIC_` prefix
- Created a frontend-specific `.env` file through the setup script
- Default API URL is now configurable and properly typed

### 🚀 Automated Setup

The project setup script has been enhanced to:

- Automatically install required TypeScript dependencies
- Configure Tailwind CSS when detected in the codebase
- Set up environment variables for the frontend
- Skip installation steps if dependencies are already present

## Development Guide

### Environment Setup

1. Run the setup script from the project root:
   ```bash
   ./setup.sh
   ```

2. The script will automatically:
   - Install necessary dependencies
   - Configure TypeScript
   - Set up Tailwind CSS
   - Create environment variables

### Manual Setup (if needed)

If you need to manually set up the environment:

1. Install TypeScript Node types:
   ```bash
   npm install --save-dev @types/node --legacy-peer-deps
   ```

2. Install Tailwind CSS:
   ```bash
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

3. Create a `.env` file with:
   ```
   EXPO_PUBLIC_API_URL=http://localhost:8081
   EXPO_PUBLIC_OAUTH_REDIRECT_URI=http://localhost:8081/auth/callback
   EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
   ```

## Troubleshooting

### Package Version Issues

If you encounter errors after updating packages:

1. **Incompatibility errors**: Try running the frontend script again or manually install packages
2. **Build failures**: Check for platform-specific issues
3. **Metro bundler errors**: Clear the cache with `npx expo start --clear`

### TypeScript Errors

- If you see "Cannot find name 'process'", ensure `node` is in the types array in `tsconfig.json`
- For React Native specific types, `@tsconfig/react-native` should be installed

### Tailwind CSS Issues

- If you see "Unknown at rule @tailwind", run the Tailwind setup commands manually
- Ensure your CSS file includes all three directives: base, components, and utilities
