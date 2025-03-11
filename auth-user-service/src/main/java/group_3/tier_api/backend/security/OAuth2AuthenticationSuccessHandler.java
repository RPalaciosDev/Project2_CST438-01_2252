package group_3.tier_api.backend.security;

import group_3.tier_api.backend.models.Role;
import group_3.tier_api.backend.models.User;
import group_3.tier_api.backend.repositories.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Map;
import java.util.Optional;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @Value("${cors.allowed-origins:http://localhost:3000}")
    private String[] allowedOrigins;

    @Value("${oauth2.redirect-uri:${OAUTH2_REDIRECT_URI:http://localhost:3000/oauth2/redirect}}")
    private String redirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        if (response.isCommitted()) {
            return;
        }

        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oAuth2User = oauthToken.getPrincipal();

        String provider = oauthToken.getAuthorizedClientRegistrationId();
        String providerId = oAuth2User.getName();

        // Get user details from OAuth provider
        String email = extractEmail(oAuth2User, provider);
        String name = extractName(oAuth2User, provider);

        // Find existing user or create new one
        Optional<User> existingUser = userRepository.findByProviderAndProviderId(provider, providerId);

        User user;
        if (existingUser.isPresent()) {
            user = existingUser.get();
            // Update user info if needed
            if (!user.getEmail().equals(email)) {
                user.setEmail(email);
            }
            if (name != null && !name.equals(user.getFullName())) {
                user.setFullName(name);
            }
        } else {
            // Check if user exists with this email
            Optional<User> userByEmail = userRepository.findByEmail(email);

            if (userByEmail.isPresent()) {
                // Link this provider to existing account
                user = userByEmail.get();
                user.setProvider(provider);
                user.setProviderId(providerId);
            } else {
                // Create new user
                String username = generateUsername(email);
                user = new User(username, email, provider, providerId);
                user.setFullName(name);
                user.addRole(Role.ROLE_USER);
            }
        }

        userRepository.save(user);

        // Generate JWT token
        String token = jwtUtils.generateTokenFromUsername(user.getUsername());

        // Build the redirect URL with the token
        String targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
                .queryParam("token", token)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    private String extractEmail(OAuth2User oAuth2User, String provider) {
        Map<String, Object> attributes = oAuth2User.getAttributes();

        if ("google".equals(provider)) {
            return (String) attributes.get("email");
        } else if ("github".equals(provider)) {
            // GitHub doesn't always expose email, might need additional steps
            return (String) attributes.get("email");
        }

        return "";
    }

    private String extractName(OAuth2User oAuth2User, String provider) {
        Map<String, Object> attributes = oAuth2User.getAttributes();

        if ("google".equals(provider)) {
            return (String) attributes.get("name");
        } else if ("github".equals(provider)) {
            return (String) attributes.get("name");
        }

        return "";
    }

    private String generateUsername(String email) {
        // Create username from email (remove domain part)
        String username = email.substring(0, email.indexOf('@'));

        // Check if username already exists
        if (userRepository.existsByUsername(username)) {
            // Append random number if username exists
            username = username + System.currentTimeMillis() % 1000;
        }

        return username;
    }
}