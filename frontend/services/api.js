// Import URLs from auth.ts
import {
  AUTH_SERVICE_URL,
  TIERLIST_API_URL,
  IMAGE_API_URL,
  ML_API_URL,
  CHAT_API_URL,
} from './auth';

// Log the API URLs for debugging
console.log('API URLs:');
console.log('AUTH_API_URL:', AUTH_SERVICE_URL);
console.log('TIERLIST_API_URL:', TIERLIST_API_URL);
console.log('IMAGE_API_URL:', IMAGE_API_URL);
console.log('ML_API_URL:', ML_API_URL);
console.log('CHAT_API_URL:', CHAT_API_URL);

// Re-export the URLs for use in other services
export {
  AUTH_SERVICE_URL as AUTH_API_URL,
  TIERLIST_API_URL,
  CHAT_API_URL,
  IMAGE_API_URL,
  ML_API_URL,
};
