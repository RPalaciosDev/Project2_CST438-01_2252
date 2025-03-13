# JWT Authentication Debugging Guide

This guide provides information on debugging JWT authentication issues in the auth_user_api service.

## JWT Configuration

The JWT secret is configured in the following places:

1. **Environment Variables**: The `JWT_SECRET` environment variable should be set in your deployment environment (Railway, Heroku, etc.)
2. **Application Properties**: The fallback value is defined in `application.properties` with:
   ```
   jwt.secret=${JWT_SECRET:fallback-value}
   ```

## Common JWT Issues

Here are common issues that can occur with JWT authentication:

### 401 Unauthorized Errors

If you're getting 401 Unauthorized errors when accessing protected endpoints, it could be due to:

1. **Missing JWT Token**: The frontend is not sending the token in the Authorization header.
2. **Invalid Token Format**: The token should be sent as `Bearer <token>`.
3. **Expired Token**: The JWT has expired and needs to be refreshed.
4. **Invalid Signature**: The token was signed with a different secret than the one used for verification.
5. **Token Tampering**: The token has been modified and fails signature verification.

### Secret Key Mismatch

The most common issue is a **secret key mismatch** between:
- The environment where the token was generated
- The environment where the token is being verified

This happens when:
- Different JWT_SECRET environment variables are set in different environments
- The application was restarted with a new secret key
- Different instances have different secrets

## Debugging Steps

### 1. Check Environment Variables

Verify the `JWT_SECRET` environment variable is set correctly:

```bash
# Check if variable is set on Railway
railway variables list
```

### 2. Check Token Format

Ensure the frontend is sending the token correctly:

```javascript
// JavaScript Fetch example
fetch('/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

### 3. Use the Debug Endpoint

The API includes a debug endpoint to help diagnose JWT issues:

```
GET /api/auth/debug?token=your-jwt-token
```

This will return:
- Authentication status
- JWT configuration information
- Token validation results
- Token expiration status

### 4. Check Logs

Enable DEBUG logging in `application.properties`:

```
logging.level.group_3.auth_user_api.security=DEBUG
```

This will show detailed information about:
- Token extraction
- Signature verification steps
- Claims extraction
- Expiration validation

### 5. Testing with curl

Test your JWT authentication using curl:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8080/api/auth/me
```

## Best Practices

1. **Keep the Secret Safe**: Never commit the JWT secret to version control
2. **Use a Strong Secret**: Use a long, random string (at least 64 characters)
3. **Consistent Environment**: Use the same JWT_SECRET across all environments
4. **Token Storage**: Store tokens securely in the frontend (e.g., HttpOnly cookies or localStorage)

## Troubleshooting Flowchart

1. Is the token being sent in the Authorization header? -> If no, fix the frontend
2. Is the token format correct (Bearer prefix)? -> If no, fix the token format
3. Is the JWT_SECRET environment variable set? -> If no, set it
4. Is the same JWT_SECRET used across all environments? -> If no, standardize it
5. Has the token expired? -> If yes, refresh the token
6. Are there any errors in the logs? -> If yes, address the specific error

## Need Further Help?

Use the `/api/auth/debug` endpoint to provide more information about your JWT configuration and token issues when seeking support. 