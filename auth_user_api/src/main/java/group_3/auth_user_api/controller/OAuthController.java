package group_3.auth_user_api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller to help debug and test OAuth integration
 */
@RestController
@RequestMapping("/api/oauth")
public class OAuthController {

    private static final Logger logger = LoggerFactory.getLogger(OAuthController.class);

    // Using hard-coded URL instead of property injection
    private final String frontendUrl = "https://lovetiers.com";

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

    /**
     * Get OAuth configuration for clients
     */
    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getOAuthConfig() {
        logger.info("OAuth config requested");

        Map<String, Object> config = new HashMap<>();
        config.put("googleClientId", googleClientId);
        config.put("redirectUri", frontendUrl + "/oauth-callback");
        config.put("googleAuthUrl", "/oauth2/authorization/google");

        return ResponseEntity.ok(config);
    }

    /**
     * Test endpoint to check OAuth integration
     */
    @GetMapping("/test")
    public ResponseEntity<Map<String, String>> testOAuth() {
        logger.info("OAuth test endpoint accessed");

        Map<String, String> response = new HashMap<>();
        response.put("status", "OAuth endpoints are operational");
        response.put("loginUrl", "/oauth2/authorization/google");

        return ResponseEntity.ok(response);
    }
}