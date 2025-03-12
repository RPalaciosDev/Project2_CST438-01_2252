package group_3.auth_user_api.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import group_3.auth_user_api.model.User;
import group_3.auth_user_api.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    public OAuth2LoginSuccessHandler(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        if (email == null) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Email is required");
            return;
        }

        // Find or create user
        Optional<User> existingUser = userRepository.findByEmail(email);
        User user;

        if (existingUser.isPresent()) {
            user = existingUser.get();
        } else {
            // Create new user from OAuth data
            user = new User();
            user.setEmail(email);
            user.setName(oAuth2User.getAttribute("name"));
            user.setPicture(oAuth2User.getAttribute("picture"));
            user.setRoles(List.of("ROLE_USER"));
            userRepository.save(user);
        }

        // Generate JWT token
        String token = jwtUtil.generateToken(email);
        user.setJwtToken(token); // Optional: store the token
        userRepository.save(user);

        // Create response with user data and token
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("token", token);
        responseData.put("user", Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "name", user.getName(),
                "picture", user.getPicture(),
                "roles", user.getRoles()));

        // Set response headers and write the JSON response
        response.setContentType("application/json");
        response.getWriter().write(objectMapper.writeValueAsString(responseData));

        // Alternatively, redirect to the frontend with token
        // response.sendRedirect(frontendUrl + "/oauth2/redirect?token=" + token);
    }
}
