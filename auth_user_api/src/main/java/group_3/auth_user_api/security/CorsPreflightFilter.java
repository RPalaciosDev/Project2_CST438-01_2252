package group_3.auth_user_api.security;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.List;

/**
 * Filter to handle CORS preflight OPTIONS requests before they reach Spring
 * Security.
 * This ensures that OPTIONS requests are processed properly even for protected
 * endpoints.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE) // Make sure this runs before all other filters
public class CorsPreflightFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(CorsPreflightFilter.class);

    @Value("${cors.allowed-origins:https://frontend-production-c2bc.up.railway.app,https://imageapi-production-af11.up.railway.app,https://lovetiers.com,http://localhost:19006,http://localhost:3000}")
    private List<String> allowedOrigins;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Get the Origin header
        String origin = request.getHeader("Origin");

        // Log the request details for debugging
        logger.debug("CorsPreflightFilter processing request: {} {} with Origin: {}",
                request.getMethod(), request.getRequestURI(), origin);

        // If this is an OPTIONS request, we'll handle it specially for CORS
        if (request.getMethod().equals("OPTIONS")) {
            if (origin != null && isAllowedOrigin(origin)) {
                logger.debug("Setting CORS headers for OPTIONS request from origin: {}", origin);

                response.setHeader("Access-Control-Allow-Origin", origin);
                response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
                response.setHeader("Access-Control-Allow-Headers",
                        "Authorization, Content-Type, X-Requested-With, Accept, Origin");
                response.setHeader("Access-Control-Expose-Headers", "Authorization");
                response.setHeader("Access-Control-Allow-Credentials", "true");
                response.setHeader("Access-Control-Max-Age", "3600");

                // Return status 200 for OPTIONS
                response.setStatus(HttpServletResponse.SC_OK);

                // Don't continue the filter chain for OPTIONS requests
                return;
            } else {
                logger.warn("OPTIONS request with origin {} is not allowed", origin);
            }
        } else if (origin != null && isAllowedOrigin(origin)) {
            // For non-OPTIONS requests from allowed origins, add CORS headers but continue
            // the filter chain
            logger.debug("Setting CORS headers for {} request from origin: {}", request.getMethod(), origin);

            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Access-Control-Allow-Credentials", "true");
        }

        // Continue the filter chain for non-OPTIONS requests or unmatched origins
        filterChain.doFilter(request, response);
    }

    private boolean isAllowedOrigin(String origin) {
        // If we don't have any allowed origins configured, default to a permissive list
        if (allowedOrigins == null || allowedOrigins.isEmpty()) {
            return origin.equals("https://frontend-production-c2bc.up.railway.app") ||
                    origin.equals("https://imageapi-production-af11.up.railway.app") ||
                    origin.equals("https://lovetiers.com") ||
                    origin.equals("http://localhost:19006") ||
                    origin.equals("http://localhost:3000");
        }

        // Otherwise, check against our configured list
        boolean isAllowed = allowedOrigins.contains(origin);
        if (!isAllowed) {
            logger.debug("Origin {} is not in allowed list: {}", origin, allowedOrigins);
        }
        return isAllowed;
    }
}