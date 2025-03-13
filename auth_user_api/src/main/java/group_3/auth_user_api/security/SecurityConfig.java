package group_3.auth_user_api.security;

import group_3.auth_user_api.security.jwt.JwtAuthConverter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.web.BearerTokenAuthenticationEntryPoint;
import org.springframework.security.oauth2.server.resource.web.access.BearerTokenAccessDeniedHandler;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.http.HttpMethod;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Value("${cors.allowed-origins}")
    private String allowedOrigins;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private JwtAuthConverter jwtAuthConverter;

    @Autowired
    private OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Bean
    public JwtDecoder jwtDecoder() {
        // Create a secret key from the JWT secret
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        SecretKey secretKey = new SecretKeySpec(keyBytes, "HmacSHA512");

        // Create a JWT decoder with the secret key using HS512 algorithm
        return NimbusJwtDecoder.withSecretKey(secretKey)
                .build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public SecurityFilterChain corsFilterChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher(AntPathRequestMatcher.antMatcher(HttpMethod.OPTIONS, "/**"))
                .authorizeHttpRequests(authorize -> authorize.anyRequest().permitAll())
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        return http.build();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers("/api/auth/signin").permitAll()
                        .requestMatchers("/api/auth/signup").permitAll()
                        .requestMatchers("/api/auth/status").permitAll()
                        .requestMatchers("/api/auth/debug").permitAll()
                        .requestMatchers("/api/auth/debug-token").permitAll()
                        .requestMatchers("/api/auth/google-token").permitAll()
                        // OAuth test endpoints
                        .requestMatchers("/api/oauth/config").permitAll()
                        .requestMatchers("/api/oauth/test").permitAll()
                        // OAuth2 endpoints
                        .requestMatchers("/oauth2/**").permitAll()
                        .requestMatchers("/login/oauth2/**").permitAll()
                        .requestMatchers("/actuator/**").permitAll()
                        // Health check endpoints - explicitly allow all
                        .requestMatchers("/health").permitAll()
                        .requestMatchers("/health-check").permitAll()
                        .requestMatchers("/health-root").permitAll()
                        .requestMatchers("/").permitAll() // Root path for Railway
                        // All other requests need authentication
                        .anyRequest().authenticated())
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(new BearerTokenAuthenticationEntryPoint())
                        .accessDeniedHandler(new BearerTokenAccessDeniedHandler()))
                // OAuth2 login configuration
                .oauth2Login(oauth2 -> oauth2
                        .successHandler(oAuth2LoginSuccessHandler))
                // JWT token validation configuration
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt
                                .decoder(jwtDecoder())
                                .jwtAuthenticationConverter(jwtAuthConverter)))
                // JWT authentication filter
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Add frontend domain explicitly along with any configured origins
        List<String> corsAllowedOrigins = new ArrayList<>();

        // Add specific origins
        corsAllowedOrigins.add("http://localhost:3000");
        corsAllowedOrigins.add("http://localhost:19006");
        corsAllowedOrigins.add("https://frontend-production-c2bc.up.railway.app");

        // Add any additional origins from the configuration
        if (allowedOrigins != null && !allowedOrigins.isEmpty()) {
            String[] origins = allowedOrigins.split(",");
            for (String origin : origins) {
                if (!origin.equals("*") && !corsAllowedOrigins.contains(origin.trim())) {
                    corsAllowedOrigins.add(origin.trim());
                }
            }
        }

        configuration.setAllowedOrigins(corsAllowedOrigins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setMaxAge(3600L); // 1 hour to cache preflight response

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}