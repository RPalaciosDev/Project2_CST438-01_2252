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
            logger.info("CORS allowed origins set from environment: {}", allowedOriginsStr);
        } else {
            // Default allowed origins for local development
            allowedOrigins = new String[] {
                    "http://localhost:19006",
                    "http://localhost:19000",
                    "https://app.yourdomain.com" // Railway frontend domain
            };
            logger.info("Using default CORS allowed origins: {}", Arrays.toString(allowedOrigins));
        }

        registry.addMapping("/**")
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("Authorization", "Content-Type", "x-auth-token")
                .exposedHeaders("x-auth-token")
                .allowCredentials(true);

        logger.info("CORS configuration added for tier list service");
    }
}