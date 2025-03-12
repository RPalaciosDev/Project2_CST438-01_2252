# Railway Environment Variables for Auth User Service

This document lists all the required environment variables that need to be configured in your Railway project for the Auth User Service to work correctly.

## Essential Environment Variables

| Variable Name | Description | Example Value |
|---------------|-------------|---------------|
| `SPRING_DATA_MONGODB_URI` | MongoDB connection string | `mongodb+srv://username:password@host/auth_db?retryWrites=true&w=majority` |
| `JWT_SECRET` | Secret key for JWT token signing | `a-secure-random-string-at-least-32-chars-long` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `your-google-client-id.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `your-google-client-secret` |
| `OAUTH_REDIRECT_URI` | OAuth redirect URI | `https://auth-user-service-production.up.railway.app/login/oauth2/code/google` |
| `OAUTH2_REDIRECT_URI` | Frontend redirect URI after OAuth | `https://frontend-production-c2bc.up.railway.app/oauth2/redirect` |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `https://frontend-production-c2bc.up.railway.app,https://lovetiers.com` |
| `APP_SECURE_BASE_URL` | Secure base URL for the auth service | `https://auth-user-service-production.up.railway.app` |
| `PORT` | Application port (set automatically by Railway) | `8080` |

## Spring Profile Configuration

| Variable Name | Description | Example Value |
|---------------|-------------|---------------|
| `SPRING_PROFILES_ACTIVE` | Active Spring profiles | `prod` |

## Optional/Advanced Configuration

| Variable Name | Description | Default Value |
|---------------|-------------|---------------|
| `SPRING_DATA_MONGODB_CONNECTION_TIMEOUT` | MongoDB connection timeout (ms) | `10000` |
| `SPRING_DATA_MONGODB_SOCKET_TIMEOUT` | MongoDB socket timeout (ms) | `60000` |
| `SPRING_DATA_MONGODB_SERVER_SELECTION_TIMEOUT` | MongoDB server selection timeout (ms) | `30000` |

## Troubleshooting

If you encounter connection issues with MongoDB, verify these points:

1. The `SPRING_DATA_MONGODB_URI` format is correct
2. The MongoDB instance is accessible from Railway
3. The database name in the URI matches the configuration
4. Network access settings allow connections from Railway's IP range

## Health Check Endpoints

Once deployed, you can verify your service is running correctly by accessing:

- Basic health check: `https://[your-railway-url]/health`
- MongoDB connection test: `https://[your-railway-url]/api/health/db`
- Service information: `https://[your-railway-url]/service-info`
- Spring Boot Actuator: `https://[your-railway-url]/actuator/health` 