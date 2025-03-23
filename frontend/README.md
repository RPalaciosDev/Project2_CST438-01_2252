# LoveTiers Frontend Application

A modern, mobile-first frontend application built with Expo and React Native for creating, sharing, and exploring tier lists.

## Features

- **Authentication System**
  - Email/password authentication
  - Google OAuth2 integration
  - Secure token storage
  - Profile completion flow

- **Tier List Management**
  - Create custom tier lists with the tier builder
  - Browse community-created tier lists
  - Daily tier list challenges
  - Drag-and-drop interface for ranking items
  - Track completed tier lists

- **Tag System**
  - Browse tier lists by tags
  - Record user tag preferences
  - Track tag popularity and usage
  - Personalized recommendations based on tags

- **User Interface**
  - Responsive design for mobile and web
  - Animated sidebar with real-time updates
  - Theme customization via StyleContext
  - Accessibility features

- **Real-time Updates**
  - Daily tier list status tracking
  - User activity notifications
  - Chat system integration

## Tech Stack

- **Core**: Expo (SDK 52), React Native 0.76.7, React 18.3.1
- **Navigation**: Expo Router 4.0
- **State Management**: Zustand
- **API Integration**: Axios
- **Styling**: StyleSheet API, Context API for themes
- **Authentication**: expo-secure-store, expo-auth-session, expo-web-browser
- **Animations**: react-native-reanimated, react-native-gesture-handler
- **Data Visualization**: Custom components for tier lists

## Directory Structure

```
frontend/
├── app/                   # Main application routes (Expo Router)
│   ├── auth/              # Authentication flow routes
│   ├── chats/             # Chat functionality
│   ├── context/           # Context providers (StyleContext, etc.)
│   ├── tierlists/         # Tier list viewing and editing
│   ├── _layout.tsx        # Root layout with navigation and auth wrapper
│   ├── auth-check.tsx     # Auth status verification
│   ├── browse.tsx         # Browse tier lists
│   ├── home.tsx           # Home screen
│   ├── index.tsx          # Entry point
│   ├── my-tiers.tsx       # User's tier lists
│   ├── sign-in.tsx        # Login screen
│   ├── sign-up.tsx        # Registration screen
│   ├── startup.tsx        # Onboarding flow
│   └── tier-builder.tsx   # Create new tier lists
├── assets/                # Static assets (images, fonts)
├── components/            # Reusable UI components
├── contexts/              # App-wide context providers
├── services/              # API and service integrations
│   ├── auth.ts            # Authentication service
│   ├── oauth.ts           # OAuth2 integration
│   └── api.js             # Base API configuration
├── store/                 # Zustand state stores
│   └── auth-store.ts      # Authentication state
├── styles/                # Shared styles and themes
└── types/                 # TypeScript type definitions
```

## Key Components and Features

### Authentication System

The app implements a comprehensive authentication system with:

- **Multiple Auth Methods**: Both traditional username/password and OAuth2 with Google
- **Token Management**: JWT tokens stored securely with expo-secure-store
- **Auto-refresh**: Automatic token validation and refresh
- **Auth Protection**: Routes protected against unauthorized access
- **Profile Flow**: User profile completion tracking

### Tag System Integration

The tag system works across the app to personalize the user experience:

- **Recording User Preferences**:
  - When users submit tier lists, tags are recorded via `POST /api/user/tags/record/{userId}`
  - The app uses this data to personalize content recommendations

- **Browsing by Tags**:
  - In browse.tsx, tier lists are categorized by tags
  - Users can discover content based on interests

- **Tier Builder Integration**:
  - Users can assign tags when creating tier lists
  - Tags help categorize and make content discoverable

### Daily Tier List Feature

The daily tier list system encourages regular engagement:

- **Sidebar Integration**:
  - Real-time status display in the animated sidebar
  - Shows completion status and refreshes periodically

- **Completion Tracking**:
  - Records when users complete the daily challenge
  - Updates the UI to reflect completion status

- **Backend Integration**:
  - Communicates with the tier list service to fetch daily challenges
  - Posts completion status back to the server

## State Management

The app uses Zustand for state management with these key stores:

- **AuthStore**: Manages authentication state, user data, and token handling
- **StyleStore**: Controls theme selection and UI preferences

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

## Environment Setup

### Environment Variables

Create a `.env` file in the frontend directory with:

```
EXPO_PUBLIC_API_URL=http://localhost:8081
EXPO_PUBLIC_TIERLIST_API_URL=http://localhost:8082
EXPO_PUBLIC_CHAT_API_URL=http://localhost:8083
EXPO_PUBLIC_IMAGE_API_URL=http://localhost:8084
EXPO_PUBLIC_ML_API_URL=http://localhost:8085
EXPO_PUBLIC_OAUTH_REDIRECT_URI=http://localhost:8081/login/oauth2/code/google
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### API Configuration

The frontend communicates with these backend services:

- **Auth User API**: User authentication and management (`AUTH_SERVICE_URL`)
- **Tier List Service**: Tier list CRUD operations (`TIERLIST_API_URL`)
- **Image Storage Service**: Image management (`IMAGE_API_URL`)
- **ML Service**: Recommendation and matching (`ML_SERVICE_URL`)
- **Chat Service**: User messaging (`CHAT_API_URL`)

## Available Pages

### Main Navigation

- **Home**: Dashboard with recent activity and quick actions
- **Browse**: Discover tier lists by categories and tags
- **My Tiers**: Personal tier lists and history
- **Tier Builder**: Create and edit tier lists
- **Chat**: Messaging interface

### Authentication Flow

- **Sign In**: Login with email/password or Google
- **Sign Up**: Create a new account
- **Auth Check**: Verify authentication status
- **Startup**: Onboarding and profile setup

## Backend Integration

The frontend integrates with backend services through:

1. **Authentication Module** (services/auth.ts):
   - Handles login, registration, and token management
   - Communicates with auth_user_api service

2. **Tier List Management**:
   - Creates and fetches tier lists from tier-list-service
   - Manages daily tier lists and completion tracking

3. **Tag System Integration**:
   - Records user tag preferences to auth_user_api
   - Retrieves tag-based recommendations

4. **Image Management**:
   - Uploads and fetches images from image-storage-service
   - Handles image selection in tier builder

## Development Best Practices

- Use the StyleContext for theme-consistent UI components
- Follow the established patterns for API calls and error handling
- Use Zustand stores for shared state management
- Keep components modular and reusable
- Leverage TypeScript for type safety

## Troubleshooting

### Package Version Issues

If you encounter errors after updating packages:

1. **Incompatibility errors**: Try running the frontend script again or manually install packages
2. **Build failures**: Check for platform-specific issues
3. **Metro bundler errors**: Clear the cache with `npx expo start --clear`

### TypeScript Errors

- If you see "Cannot find name 'process'", ensure `node` is in the types array in `tsconfig.json`
- For React Native specific types, `@tsconfig/react-native` should be installed

### Authentication Issues

- Check that OAuth redirects are properly configured
- Verify environment variables are set correctly
- Ensure backend services are running
