# Tier List ML Service Integration

## Overview

This PR integrates the tier list component with the ML matching service. Users can now create tier lists by dragging and dropping items into different tiers, then submit their preferences to the ML service for processing and potential matches.

## Tier List Component Implementation

The tier list component (`frontend/app/tierlists/index.tsx`) provides the following functionality:

1. **Drag and Drop Interface**: Users can drag items from the available pool and drop them into different tier rows (S, A, B, C, D, E, F). The implementation handles both web and mobile platforms with different drag-and-drop systems:
   - Web: Uses the HTML5 drag and drop API
   - Mobile: Uses gesture handlers from React Native Reanimated

2. **Template Loading**: Loads tier list templates from the backend, fetching both template metadata and associated images.

3. **User Interaction**:
   - Users can drag items from the available pool to tier rows
   - Items can be removed from tiers by tapping/clicking them, returning them to the available pool
   - A "Match" button appears when all items have been sorted into tiers

4. **Data Transformation**: Before submission to the ML service, the component:
   - Extracts image names from URIs
   - Removes file extensions
   - Formats names by replacing spaces with underscores
   - Creates a structured tier list with image names as keys and tier labels as values

5. **Authentication Integration**: Retrieves the current user's ID from the authentication store to associate tier list preferences with the user

6. **ML Service Submission**: Submits the formatted tier list data to the ML service endpoint

## ML Service Changes

1. **CORS Configuration**: Updated the ML service to accept cross-origin requests from frontend domains.

   ```python
   # Configure CORS to allow requests from all frontend domains
   CORS(app, resources={r"/*": {"origins": [
       "https://frontend-production-c2bc.up.railway.app",
       "https://frontend-production.up.railway.app",
       "https://ml-matching.up.railway.app",
       "https://ml-service-production.up.railway.app",
       "http://localhost:8081",
       "http://localhost:3000",
       "http://localhost:19006",
       "http://localhost:19000",
       "exp://localhost:19000"
   ], "methods": ["GET", "POST", "OPTIONS"], "allow_headers": ["Content-Type", "Authorization"]}})
   ```

2. **Updated Dependencies**: Added Flask-CORS and Gunicorn to requirements.txt to ensure proper CORS handling in production.

3. **Service URL Correction**: Updated the frontend to use the correct ML service URL:

   ```javascript
   const ML_SERVICE_URL = "https://ml-matching.up.railway.app";
   ```

## User Flow

1. User navigates to a tier list template
2. User drags and drops items into different tiers based on their preferences
3. After sorting all items, the "Match" button appears
4. User clicks "Match" to submit their preferences to the ML service
5. User receives confirmation that their tier list was submitted
6. User is redirected back to the previous screen

## Testing Notes

The integration has been tested to ensure:

- Tier list data is correctly formatted before submission
- Communication with the ML service works without CORS errors
- User authentication information is properly included with tier list submissions
- User receives appropriate feedback throughout the process

## Future Improvements

- Add capability for users to view their existing tier lists
- Implement a match notification system when new matches are found
- Add real-time updating of potential matches
