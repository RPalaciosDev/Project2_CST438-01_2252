package group_3.tier_api.backend.security;

import group_3.tier_api.backend.models.AuthProvider;
import group_3.tier_api.backend.models.User;
import group_3.tier_api.backend.repositories.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Simplified version of OAuth2AuthenticationSuccessHandler
 * that doesn't depend on OAuth2 classes
 */
@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final Logger logger = LoggerFactory.getLogger(OAuth2AuthenticationSuccessHandler.class);

    @Value("${cors.allowed-origins:https://frontend-production-c2bc.up.railway.app,http://localhost:19006}")
    private String[] allowedOrigins;

    @Value("${oauth2.redirect-uri:https://frontend-production-c2bc.up.railway.app}")
    private String redirectUri;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserRepository userRepository;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        logger.info("OAuth2 Authentication Success Handler triggered");

        try {
            if (!(authentication instanceof OAuth2AuthenticationToken)) {
                logger.error("Authentication is not an OAuth2AuthenticationToken: {}",
                        authentication.getClass().getName());
                response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid authentication type");
                return;
            }

            OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
            OAuth2User oauth2User = oauthToken.getPrincipal();
            String provider = oauthToken.getAuthorizedClientRegistrationId();

            logger.info("Processing OAuth2 login for provider: {}", provider);

            Map<String, Object> attributes = oauth2User.getAttributes();
            String email = (String) attributes.get("email");
            if (email == null) {
                logger.error("Email is null for OAuth2 user: {}", attributes);
                response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Email not provided by OAuth provider");
                return;
            }

            logger.info("OAuth2 user email: {}", email);

            // Find or create the user
            User user = findOrCreateUser(provider, oauth2User);

            // Generate token using the user's email
            String token = jwtUtils.generateTokenFromUsername(user.getEmail());

            // Build the redirect URL to the main frontend URL with token parameters
            String targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
                    .queryParam("token", token)
                    .queryParam("userId", user.getId())
                    .queryParam("email", user.getEmail())
                    .queryParam("username", user.getUsername())
                    .queryParam("auth_time", System.currentTimeMillis())
                    .queryParam("auth_status", "success")
                    .queryParam("login_type", "oauth2_" + provider.toLowerCase())
                    .build().toUriString();

            // Log the redirect for debugging
            logger.info("Redirecting to: {}", targetUrl);

            // Ensure it's a secure URL in production
            targetUrl = ensureSecureUrl(targetUrl);

            getRedirectStrategy().sendRedirect(request, response, targetUrl);
        } catch (Exception e) {
            logger.error("Error in OAuth2 authentication success handler", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Authentication processing failed");
        }
    }

    private User findOrCreateUser(String provider, OAuth2User oauth2User) {
        Map<String, Object> attributes = oauth2User.getAttributes();
        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");
        String providerId = (String) attributes.get("sub"); // For Google OAuth

        logger.info("Finding or creating user: email={}, provider={}, providerId={}", email, provider, providerId);

        Optional<User> existingUser = userRepository.findByEmail(email);

        if (existingUser.isPresent()) {
            User user = existingUser.get();
            logger.info("User already exists with ID: {}", user.getId());

            // Update provider details if not already set
            if (user.getProvider() == null || user.getProviderId() == null) {
                logger.info("Updating provider details for existing user");
                user.setProvider(provider.toUpperCase());
                return userRepository.save(user);
            }

            return user;
        } else {
            // Create new user
            logger.info("Creating new user from OAuth2 data");
            User user = new User();
            user.setEmail(email);
            user.setUsername(name);
            user.setProvider(provider.toUpperCase());
            user.setProviderId(providerId);
            user.setEnabled(true);

            return userRepository.save(user);
        }
    }

    /**
     * Ensures that URLs use HTTPS in production environments.
     * In development, HTTP is allowed.
     */
    private String ensureSecureUrl(String url) {
        // Check if we're in production and the URL is using HTTP
        if (isProductionEnvironment() && url.startsWith("http://")) {
            String secureUrl = url.replace("http://", "https://");
            logger.warn("Converting HTTP URL to HTTPS for production: {} -> {}", url, secureUrl);
            return secureUrl;
        }
        return url;
    }

    /**
     * Determines if the application is running in a production environment.
     */
    private boolean isProductionEnvironment() {
        // Check active profiles
        String activeProfiles = System.getProperty("spring.profiles.active", "");
        if (activeProfiles.contains("prod")) {
            return true;
        }

        // Check environment variables that would indicate production
        String env = System.getenv("ENVIRONMENT");
        return "production".equalsIgnoreCase(env) || "prod".equalsIgnoreCase(env);
    }
}