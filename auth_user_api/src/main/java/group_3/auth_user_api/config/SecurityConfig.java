package group_3.auth_user_api.config;

import group_3.auth_user_api.security.JwtAuthenticationFilter;
import group_3.auth_user_api.security.OAuth2LoginSuccessHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
public class SecurityConfig {
    private static final Logger logger = LoggerFactory.getLogger(SecurityConfig.class);

    private final OAuth2LoginSuccessHandler successHandler;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(OAuth2LoginSuccessHandler successHandler, JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.successHandler = successHandler;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        logger.info("Configuring security filter chain");

        try {
            http
                    .csrf(AbstractHttpConfigurer::disable)
                    .cors(cors -> {
                    })
                    .headers(headers -> headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::disable))
                    .authorizeHttpRequests(auth -> auth
                            // Allow health endpoints
                            .requestMatchers("/", "/health", "/actuator/health", "/actuator/**").permitAll()
                            // Allow authentication endpoints
                            .requestMatchers("/welcome", "/oauth2/**", "/api/auth/**").permitAll()
                            // Require authentication for everything else
                            .anyRequest().authenticated())
                    .oauth2Login(oauth2 -> oauth2
                            .successHandler(successHandler))
                    .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

            return http.build();
        } catch (Exception e) {
            logger.error("Error configuring security: {}", e.getMessage(), e);
            throw e;
        }
    }
}
