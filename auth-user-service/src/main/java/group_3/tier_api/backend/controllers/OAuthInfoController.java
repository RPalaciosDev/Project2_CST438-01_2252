package group_3.tier_api.backend.controllers;

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
     * Returns basic information about the OAuth configuration
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> getOAuthInfo() {
        logger.info("Getting OAuth configuration info");
        Map<String, Object> info = new HashMap<>();

        try {
            ClientRegistration googleRegistration = clientRegistrationRepository.findByRegistrationId("google");

            if (googleRegistration != null) {
                Map<String, Object> googleInfo = new HashMap<>();
                googleInfo.put("clientName", googleRegistration.getClientName());
                googleInfo.put("redirectUri", googleRegistration.getRedirectUri());
                googleInfo.put("authorizationUri", googleRegistration.getProviderDetails().getAuthorizationUri());
                googleInfo.put("tokenUri", googleRegistration.getProviderDetails().getTokenUri());
                googleInfo.put("userInfoUri", googleRegistration.getProviderDetails().getUserInfoEndpoint().getUri());
                googleInfo.put("scopes", googleRegistration.getScopes());

                info.put("google", googleInfo);
            } else {
                info.put("error", "Google registration not found");
            }

            info.put("activeProfiles", activeProfiles);
            info.put("isProductionEnvironment", isProductionEnvironment());

            // Add relevant environment variables (without sensitive values)
            Map<String, String> envInfo = new HashMap<>();
            envInfo.put("ENVIRONMENT", System.getenv("ENVIRONMENT"));
            envInfo.put("GOOGLE_CLIENT_ID_SET", System.getenv("GOOGLE_CLIENT_ID") != null ? "true" : "false");
            envInfo.put("GOOGLE_CLIENT_SECRET_SET", System.getenv("GOOGLE_CLIENT_SECRET") != null ? "true" : "false");
            envInfo.put("OAUTH_REDIRECT_URI_SET", System.getenv("OAUTH_REDIRECT_URI") != null ? "true" : "false");
            envInfo.put("ALLOWED_ORIGINS_SET", System.getenv("ALLOWED_ORIGINS") != null ? "true" : "false");

            info.put("environment", envInfo);

        } catch (Exception e) {
            logger.error("Error getting OAuth info", e);
            info.put("error", "Failed to retrieve OAuth configuration: " + e.getMessage());
        }

        return info;
    }

    /**
     * Determines if the application is running in a production environment.
     */
    private boolean isProductionEnvironment() {
        // Check active profiles
        if (activeProfiles.contains("prod")) {
            return true;
        }

        // Check environment variables that would indicate production
        String env = System.getenv("ENVIRONMENT");
        return "production".equalsIgnoreCase(env) || "prod".equalsIgnoreCase(env);
    }
}