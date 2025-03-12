package group_3.tier_api.backend.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for OAuth configuration diagnostics
 */
@RestController
@RequestMapping("/api/auth/oauth-info")
public class OAuthInfoController {
    private static final Logger logger = LoggerFactory.getLogger(OAuthInfoController.class);

    @Autowired
    private ClientRegistrationRepository clientRegistrationRepository;

    @Value("${spring.profiles.active:default}")
    private String activeProfiles;

    /**
     * Provides information about OAuth2 configuration for debugging purposes.
     * This endpoint is restricted to administrators only.
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> getOAuthInfo() {
        Map<String, Object> info = new HashMap<>();

        try {
            logger.info("Fetching OAuth2 configuration information");

            // Environment information
            Map<String, Object> env = new HashMap<>();
            env.put("activeProfiles", activeProfiles);
            env.put("isProduction", isProductionEnvironment());
            env.put("javaVersion", System.getProperty("java.version"));
            info.put("environment", env);

            // Google OAuth2 configuration
            ClientRegistration googleRegistration = clientRegistrationRepository.findByRegistrationId("google");
            if (googleRegistration != null) {
                Map<String, Object> googleConfig = new HashMap<>();
                googleConfig.put("clientId", maskString(googleRegistration.getClientId()));
                googleConfig.put("clientSecret", maskString(googleRegistration.getClientSecret()));
                googleConfig.put("redirectUri", googleRegistration.getRedirectUri());
                googleConfig.put("scopes", googleRegistration.getScopes());
                googleConfig.put("authorizationUri", googleRegistration.getProviderDetails().getAuthorizationUri());
                googleConfig.put("tokenUri", googleRegistration.getProviderDetails().getTokenUri());
                googleConfig.put("userInfoUri", googleRegistration.getProviderDetails().getUserInfoEndpoint().getUri());
                googleConfig.put("clientName", googleRegistration.getClientName());
                info.put("googleOAuth", googleConfig);
            } else {
                info.put("googleOAuth", "Google OAuth2 client registration not found");
            }

            // JVM & System information
            Map<String, Object> system = new HashMap<>();
            system.put("availableProcessors", Runtime.getRuntime().availableProcessors());
            system.put("freeMemory", Runtime.getRuntime().freeMemory() / (1024 * 1024) + " MB");
            system.put("maxMemory", Runtime.getRuntime().maxMemory() / (1024 * 1024) + " MB");
            system.put("totalMemory", Runtime.getRuntime().totalMemory() / (1024 * 1024) + " MB");
            info.put("system", system);

            logger.info("OAuth2 configuration information retrieved successfully");
        } catch (Exception e) {
            logger.error("Error retrieving OAuth2 configuration information", e);
            info.put("error", e.getMessage());
        }

        return info;
    }

    private boolean isProductionEnvironment() {
        return activeProfiles.contains("prod");
    }

    private String maskString(String input) {
        if (input == null || input.length() < 8) {
            return "***masked***";
        }
        // Show first 4 and last 4 characters, mask the rest
        return input.substring(0, 4) + "..." + input.substring(input.length() - 4);
    }
}