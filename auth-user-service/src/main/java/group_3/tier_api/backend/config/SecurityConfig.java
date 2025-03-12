package group_3.tier_api.backend.config;

import group_3.tier_api.backend.security.AuthTokenFilter;
import group_3.tier_api.backend.security.OAuth2AuthenticationSuccessHandler;
import group_3.tier_api.backend.security.UserDetailsServiceImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.oidc.IdTokenClaimNames;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;
import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private static final Logger logger = LoggerFactory.getLogger(SecurityConfig.class);

    // Hardcoded values as defaults with environment variables as overrides
    private static final String DEFAULT_GOOGLE_CLIENT_ID = "90481875753-p89h3cguug4634l6qj5jbe5ei11omguo.apps.googleusercontent.com";
    private static final String DEFAULT_GOOGLE_CLIENT_SECRET = "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";

    // Updated to separate production (HTTPS) and development (HTTP) URLs
    @Value("${cors.allowed-origins:https://frontend-production-c2bc.up.railway.app,http://localhost:19006}")
    private String[] allowedOrigins;

    @Value("${server.servlet.context-path:}")
    private String contextPath;

    @Value("${app.secure-base-url:https://auth-user-service-production.up.railway.app}")
    private String secureBaseUrl;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;

    @Bean
    public AuthTokenFilter authenticationJwtTokenFilter() {
        return new AuthTokenFilter();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();

        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());

        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public ClientRegistrationRepository clientRegistrationRepository() {
        logger.info("Configuring Google OAuth2 Client Registration");

        // Get client ID and secret from environment variables first, fall back to
        // defaults
        String googleClientId = System.getenv("GOOGLE_CLIENT_ID");
        if (googleClientId == null || googleClientId.isEmpty()) {
            googleClientId = DEFAULT_GOOGLE_CLIENT_ID;
            logger.info("Using default Google Client ID");
        } else {
            logger.info("Using Google Client ID from environment variable");
        }

        String googleClientSecret = System.getenv("GOOGLE_CLIENT_SECRET");
        if (googleClientSecret == null || googleClientSecret.isEmpty()) {
            googleClientSecret = DEFAULT_GOOGLE_CLIENT_SECRET;
            logger.info("Using default Google Client Secret");
        } else {
            logger.info("Using Google Client Secret from environment variable");
        }

        // In production environments, ensure we're using a secure base URL for OAuth
        String redirectUriTemplate;
        if (isProductionEnvironment()) {
            // Use the secure base URL explicitly instead of {baseUrl}
            redirectUriTemplate = secureBaseUrl + contextPath + "/login/oauth2/code/{registrationId}";
            logger.info("Using secure redirect URI template for production: {}", redirectUriTemplate);
        } else {
            // Use the default {baseUrl} placeholder for development
            redirectUriTemplate = "{baseUrl}/login/oauth2/code/{registrationId}";
            logger.info("Using default redirect URI template for development: {}", redirectUriTemplate);
        }

        // Create Google registration
        ClientRegistration googleRegistration = ClientRegistration.withRegistrationId("google")
                .clientId(googleClientId)
                .clientSecret(googleClientSecret)
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri(redirectUriTemplate)
                .scope("openid", "profile", "email")
                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .tokenUri("https://www.googleapis.com/oauth2/v4/token")
                .userInfoUri("https://www.googleapis.com/oauth2/v3/userinfo")
                .userNameAttributeName(IdTokenClaimNames.SUB)
                .jwkSetUri("https://www.googleapis.com/oauth2/v3/certs")
                .clientName("Google")
                .build();

        return new InMemoryClientRegistrationRepository(googleRegistration);
    }

    /**
     * Determines if the application is running in a production environment.
     */
    private boolean isProductionEnvironment() {
        // Check active profiles
        String activeProfiles = System.getProperty("spring.profiles.active", "");
        if (activeProfiles.contains("prod")) {
            return true;
        }

        // Check environment variables
        String env = System.getenv("SPRING_PROFILES_ACTIVE");
        return env != null && env.contains("prod");
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        logger.info("Configuring CORS with allowed origins: {}", Arrays.toString(allowedOrigins));

        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(allowedOrigins));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList(
                "Authorization",
                "Content-Type",
                "X-Requested-With",
                "Accept",
                "X-AUTH-TOKEN",
                "Origin",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers"));
        configuration.setExposedHeaders(List.of("x-auth-token"));
        configuration.setAllowCredentials(true); // Enable credentials for authentication
        configuration.setMaxAge(3600L); // Cache preflight requests for 1 hour

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        logger.info("Configuring SecurityFilterChain");

        http.csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/register").permitAll() // ✅ Explicitly allow registration
                        .requestMatchers("/api/auth/signup").permitAll()
                        .requestMatchers("/api/auth/signin").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/hello").permitAll()
                        .requestMatchers("/", "/error", "/favicon.ico").permitAll()
                        .requestMatchers("/health", "/service-info").permitAll() // Allow health check endpoints
                        .requestMatchers("/api/cache/**").permitAll() // For development
                        .anyRequest().authenticated())
                .oauth2Login(oauth2 -> {
                    try {
                        oauth2.clientRegistrationRepository(clientRegistrationRepository());
                        oauth2.successHandler(oAuth2AuthenticationSuccessHandler);
                        logger.info("OAuth2 login configuration successful");
                    } catch (Exception e) {
                        logger.error("Failed to configure OAuth2 login", e);
                    }
                });

        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
