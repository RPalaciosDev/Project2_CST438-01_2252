package group_3.tierlistservice.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Arrays;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private static final Logger logger = LoggerFactory.getLogger(WebConfig.class);

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Get allowed origins from environment variable or use defaults
        String allowedOriginsStr = System.getenv("ALLOWED_ORIGINS");
        String[] allowedOrigins;

        if (allowedOriginsStr != null && !allowedOriginsStr.isEmpty()) {
            // Split comma-separated list of allowed origins
            allowedOrigins = allowedOriginsStr.split(",");
            logger.info("CORS allowed origins set from environment: {}", Arrays.toString(allowedOrigins));
        } else {
            // Default allowed origins including hardcoded production frontend
            allowedOrigins = new String[] {
                    "http://localhost:19006",
                    "http://localhost:19000",
                    "http://localhost:3000",
                    "https://frontend-production-c2bc.up.railway.app",
                    "http://localhost:8083"
            };
            logger.info("Using default CORS allowed origins: {}", Arrays.toString(allowedOrigins));
        }

        logger.warn("[DEBUG] Allowed origins at startup: {}", Arrays.toString(allowedOrigins));

        registry.addMapping("/**")
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("Authorization", "Content-Type", "x-auth-token", "X-User-ID", "Accept", "Origin")
                .exposedHeaders("x-auth-token")
                .allowCredentials(true)
                .maxAge(3600);

        // Add specific rule for frontend domain in case environment variables aren't
        // working
        registry.addMapping("/**")
                .allowedOrigins("https://frontend-production-c2bc.up.railway.app")
                .allowedMethods("*")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);

        registry.addMapping("/**")
                .allowedOrigins("http://localhost:8083")
                .allowedMethods("*")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);

        logger.info("CORS configuration initialized for tier list service");
    }
}