package group_3.auth_user_api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    // Try to use environment variable, but provide fallback if it can't be resolved
    @Value("${cors.allowed-origins:https://frontend-production-c2bc.up.railway.app,https://imageapi-production-af11.up.railway.app,https://lovetiers.com}")
    private List<String> allowedOrigins;

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration authConfig = new CorsConfiguration();
        authConfig.setAllowCredentials(true);

        // If allowedOrigins is null or empty, use hardcoded values
        if (allowedOrigins == null || allowedOrigins.isEmpty()) {
            authConfig.setAllowedOrigins(Arrays.asList(
                    "https://frontend-production-c2bc.up.railway.app",
                    "https://imageapi-production-af11.up.railway.app",
                    "https://lovetiers.com"));
        } else {
            authConfig.setAllowedOrigins(allowedOrigins);
        }

        authConfig.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        authConfig.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept"));
        source.registerCorsConfiguration("/api/**", authConfig);

        // Add specific configuration for health endpoints - allow any origin
        CorsConfiguration healthConfig = new CorsConfiguration();
        healthConfig.addAllowedOrigin("*"); // Allow all origins for health checks
        healthConfig.setAllowedMethods(Arrays.asList("GET", "OPTIONS"));
        healthConfig.setAllowedHeaders(Arrays.asList("Content-Type"));
        source.registerCorsConfiguration("/health", healthConfig);
        source.registerCorsConfiguration("/actuator/health", healthConfig);
        source.registerCorsConfiguration("/", healthConfig);

        return new CorsFilter(source);
    }
}
