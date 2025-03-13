package group_3.auth_user_api.security;

import group_3.auth_user_api.security.jwt.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;
import java.util.Map;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final Logger logger = LoggerFactory.getLogger(OAuth2LoginSuccessHandler.class);

    private final JwtTokenProvider tokenProvider;
    // Hard-coded URL for deployment
    private final String frontendUrl = "https://lovetiers.com";

    @Autowired
    public OAuth2LoginSuccessHandler(JwtTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
        // Set default target URL directly
        setDefaultTargetUrl(frontendUrl);
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        if (response.isCommitted()) {
            logger.info("Response has already been committed");
            return;
        }

        try {
            OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();

            // Get user info from OAuth2 user
            String email = extractEmail(oauth2User);
            String name = extractName(oauth2User);

            logger.info("OAuth2 login success for user: {}", email);

            // Generate JWT token
            String token = tokenProvider.generateTokenFromUsername(
                    email,
                    Collections.singletonList("ROLE_USER"));

            // Build redirection URL with token
            String targetUrl = buildRedirectUrl(token, email, name);

            // Clear authentication attributes to prevent session fixation
            clearAuthenticationAttributes(request);

            // Redirect to frontend
            getRedirectStrategy().sendRedirect(request, response, targetUrl);

        } catch (Exception e) {
            logger.error("OAuth2 authentication success handling failed", e);
            super.onAuthenticationSuccess(request, response, authentication);
        }
    }

    /**
     * Build the redirect URL with token and user info
     */
    private String buildRedirectUrl(String token, String email, String name) {
        return frontendUrl + "/oauth-callback" +
                "?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8) +
                "&email=" + URLEncoder.encode(email, StandardCharsets.UTF_8) +
                "&name=" + URLEncoder.encode(name != null ? name : "", StandardCharsets.UTF_8);
    }

    /**
     * Extract email from OAuth2User
     */
    private String extractEmail(OAuth2User oauth2User) {
        Map<String, Object> attributes = oauth2User.getAttributes();

        String email = (String) attributes.get("email");
        if (email == null) {
            // Fallback to other attribute names
            email = (String) attributes.getOrDefault("mail", "");
        }

        return email;
    }

    /**
     * Extract name from OAuth2User
     */
    private String extractName(OAuth2User oauth2User) {
        Map<String, Object> attributes = oauth2User.getAttributes();

        // Try different attribute names that might contain the name
        return (String) attributes.getOrDefault("name",
                (String) attributes.getOrDefault("display_name",
                        (String) attributes.getOrDefault("displayName", "")));
    }
}
