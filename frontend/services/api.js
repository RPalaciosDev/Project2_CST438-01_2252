// Use environment variables from Expo for API URLs
const AUTH_API_URL = process.env.EXPO_PUBLIC_AUTH_API_URL || 'https://auth-user-service-production.up.railway.app';
const TIERLIST_API_URL = process.env.EXPO_PUBLIC_TIERLIST_API_URL || 'https://tier-list-service-production.up.railway.app';
const CHAT_API_URL = process.env.EXPO_PUBLIC_CHAT_API_URL || 'https://chat-service-production.up.railway.app';
const IMAGE_API_URL = process.env.EXPO_PUBLIC_IMAGE_API_URL || 'https://image-storage-service-production.up.railway.app';

// Export the URLs for use in other services
export { AUTH_API_URL, TIERLIST_API_URL, CHAT_API_URL, IMAGE_API_URL };