package group_3.tier_api.backend.models;

/**
 * Enum representing different authentication providers
 * Used to track how users authenticate with the system
 */
public enum AuthProvider {
    LOCAL,     // Regular username/password authentication
    GOOGLE,    // Google OAuth2
    GITHUB,    // GitHub OAuth2
    FACEBOOK   // Facebook OAuth2
} 