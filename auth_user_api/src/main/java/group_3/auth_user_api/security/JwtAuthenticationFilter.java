package group_3.auth_user_api.security;

import group_3.auth_user_api.model.User;
import group_3.auth_user_api.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtUtil jwtUtil, UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        final String requestUri = request.getRequestURI();
        final String requestMethod = request.getMethod();

        // Debug all request headers for troubleshooting
        if (requestUri.contains("/api/auth/me") || requestUri.contains("/api/auth/status")) {
            logger.debug("========== REQUEST DETAILS ==========");
            logger.debug("Processing {} request to: {}", requestMethod, requestUri);
            logger.debug("Remote IP: {}", request.getRemoteAddr());

            logger.debug("------- Request Headers -------");
            Enumeration<String> headerNames = request.getHeaderNames();
            if (headerNames != null) {
                Collections.list(headerNames).forEach(headerName -> {
                    logger.debug("{}: {}", headerName, request.getHeader(headerName));
                });
            }
            logger.debug("================================");
        }

        final String authorizationHeader = request.getHeader("Authorization");

        if (authorizationHeader == null) {
            logger.debug("No Authorization header found for: {}", requestUri);
            filterChain.doFilter(request, response);
            return;
        }

        if (!authorizationHeader.startsWith("Bearer ")) {
            logger.debug("Authorization header for {} is not a Bearer token: {}",
                    requestUri, authorizationHeader.substring(0, Math.min(10, authorizationHeader.length())) + "...");
            filterChain.doFilter(request, response);
            return;
        }

        // Extract token
        String jwt = authorizationHeader.substring(7);
        // Only log first few characters for security
        String tokenPreview = jwt.substring(0, Math.min(10, jwt.length())) + "...";
        logger.debug("JWT token found for {}: {}", requestUri, tokenPreview);

        try {
            // Extract email from token
            String email = jwtUtil.extractEmail(jwt);
            logger.debug("Email extracted from token: {}", email);

            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                Optional<User> userOptional = userRepository.findByEmail(email);

                if (userOptional.isPresent()) {
                    User user = userOptional.get();
                    logger.debug("User found: {} (ID: {})", user.getUsername(), user.getId());

                    if (jwtUtil.validateToken(jwt, email)) {
                        logger.debug("Token is valid for user: {}", email);

                        List<SimpleGrantedAuthority> authorities = user.getRoles().stream()
                                .map(SimpleGrantedAuthority::new)
                                .collect(Collectors.toList());

                        logger.debug("User roles: {}", user.getRoles());

                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                email, null, authorities);

                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        logger.debug("Authentication set in SecurityContext for user: {}", email);
                    } else {
                        logger.warn("Token validation failed for user: {} (endpoint: {})", email, requestUri);
                    }
                } else {
                    logger.warn("User not found for email: {} (endpoint: {})", email, requestUri);
                }
            }
        } catch (Exception e) {
            logger.error("Error processing JWT token for {}: {}", requestUri, e.getMessage(), e);
            // Continue processing the request - we'll let Spring Security handle
            // unauthorized access
        }

        filterChain.doFilter(request, response);

        // Log response status for debugging
        if (requestUri.contains("/api/auth/me") || requestUri.contains("/api/auth/status")) {
            logger.debug("Response status for {} {}: {}", requestMethod, requestUri, response.getStatus());
        }
    }
}