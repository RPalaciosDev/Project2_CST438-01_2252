package group_3.auth_user_api.controller;

import group_3.auth_user_api.model.User;
import group_3.auth_user_api.repository.UserRepository;
import group_3.auth_user_api.security.jwt.JwtTokenProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.BufferedReader;
import java.io.InputStreamReader;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:19006",
        "https://frontend-production-c2bc.up.railway.app" }, allowCredentials = "true")
public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private Long jwtExpiration;

    public AuthController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider tokenProvider,
            AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.authenticationManager = authenticationManager;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // If not authenticated or anonymous user
        if (authentication == null || !authentication.isAuthenticated() ||
                "anonymousUser".equals(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }

        // Find user by email (which we use as the principal name)
        Optional<User> userOptional = userRepository.findByEmail(authentication.getName());

        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        User user = userOptional.get();
        Map<String, Object> userResponse = new HashMap<>();
        userResponse.put("id", user.getId());
        userResponse.put("username", user.getUsername());
        userResponse.put("email", user.getEmail());
        userResponse.put("roles", user.getRoles());

        return ResponseEntity.ok(userResponse);
    }

    @GetMapping("/status")
    public ResponseEntity<?> authStatus() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isAuthenticated = authentication != null &&
                authentication.isAuthenticated() &&
                !authentication.getName().equals("anonymousUser");

        Map<String, Object> response = new HashMap<>();
        response.put("isAuthenticated", isAuthenticated);

        if (isAuthenticated) {
            // If authenticated, include user info
            Optional<User> userOptional = userRepository.findByEmail(authentication.getName());
            if (userOptional.isPresent()) {
                User user = userOptional.get();
                response.put("user", Map.of(
                        "id", user.getId(),
                        "username", user.getUsername(),
                        "email", user.getEmail(),
                        "roles", user.getRoles()));
            }
            response.put("authType", "JWT");
        } else {
            // If not authenticated, include auth URL
            response.put("authType", "NONE");
            response.put("googleAuthUrl", "/oauth2/authorization/google");
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/signin")
    @CrossOrigin(origins = { "http://localhost:3000", "http://localhost:19006",
            "https://frontend-production-c2bc.up.railway.app" }, allowCredentials = "true")
    public ResponseEntity<?> authenticateUser(@RequestBody Map<String, String> loginRequest) {
        String username = loginRequest.get("username");
        String password = loginRequest.get("password");

        try {
            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password));

            // Set authentication in security context
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Generate JWT token
            String token = tokenProvider.generateToken(authentication);

            // Find user
            Optional<User> userOptional = userRepository.findByEmail(username);
            if (userOptional.isEmpty()) {
                userOptional = userRepository.findByUsername(username);
            }

            if (userOptional.isPresent()) {
                User user = userOptional.get();

                // Create response with user info and token
                Map<String, Object> response = new HashMap<>();
                response.put("token", token);
                response.put("id", user.getId());
                response.put("username", user.getUsername());
                response.put("email", user.getEmail());
                response.put("roles", user.getRoles());

                return ResponseEntity.ok(response);
            }

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("User not found after authentication");
        } catch (Exception e) {
            logger.error("Authentication error: ", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid username or password");
        }
    }

    @PostMapping("/signup")
    @CrossOrigin(origins = { "http://localhost:3000", "http://localhost:19006",
            "https://frontend-production-c2bc.up.railway.app" }, allowCredentials = "true")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> signupRequest) {
        // Add detailed logging
        logger.info("Received signup request: {}", signupRequest);

        try {
            String username = signupRequest.get("username");
            String email = signupRequest.get("email");
            String password = signupRequest.get("password");

            // Check for alternate field names that the frontend might be using
            if (username == null)
                username = signupRequest.get("name");
            if (username == null)
                username = signupRequest.get("user");
            if (email == null)
                email = signupRequest.get("userEmail");
            if (password == null)
                password = signupRequest.get("userPassword");

            // Log extracted values
            logger.info("Extracted values - username: {}, email: {}, password length: {}",
                    username, email, password != null ? password.length() : 0);
            logger.info("All available fields in request: {}", signupRequest.keySet());

            // Validate required fields
            if (username == null || username.trim().isEmpty()) {
                logger.warn("Signup failed: username is missing");
                return ResponseEntity.badRequest().body("Username is required");
            }

            if (email == null || email.trim().isEmpty()) {
                logger.warn("Signup failed: email is missing");
                return ResponseEntity.badRequest().body("Email is required");
            }

            if (password == null || password.trim().isEmpty()) {
                logger.warn("Signup failed: password is missing");
                return ResponseEntity.badRequest().body("Password is required");
            }

            // Check if username already exists
            try {
                if (userRepository.existsByUsername(username)) {
                    logger.warn("Signup failed: username {} already exists", username);
                    return ResponseEntity.badRequest().body("Username is already taken");
                }
            } catch (Exception e) {
                logger.error("Error checking if username exists: ", e);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Error checking username: " + e.getMessage());
            }

            // Check if email already exists
            try {
                if (userRepository.existsByEmail(email)) {
                    logger.warn("Signup failed: email {} already exists", email);
                    return ResponseEntity.badRequest().body("Email is already in use");
                }
            } catch (Exception e) {
                logger.error("Error checking if email exists: ", e);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Error checking email: " + e.getMessage());
            }

            try {
                // Create new user using no-args constructor and setters
                User user = new User();

                user.setUsername(username);
                user.setEmail(email);

                String encodedPassword = passwordEncoder.encode(password);
                user.setPassword(encodedPassword);
                logger.info("Set password");

                user.setRoles(List.of("ROLE_USER")); // Set default role
                logger.info("Set roles");

                // Save user to database
                logger.info("Attempting to save user to database");
                User savedUser = userRepository.save(user);
                logger.info("User registered successfully: {} with ID: {}", username, savedUser.getId());

                // Generate JWT token for the new user
                logger.info("Generating token");
                String token = tokenProvider.generateTokenFromUsername(email, user.getRoles());
                logger.info("Token generated");

                // Create response with user info and token
                Map<String, Object> response = new HashMap<>();
                response.put("token", token);
                response.put("id", user.getId());
                response.put("username", user.getUsername());
                response.put("email", user.getEmail());
                response.put("roles", user.getRoles());

                return ResponseEntity.ok(response);
            } catch (Exception e) {
                logger.error("Error during user registration: ", e);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("An error occurred during registration: " + e.getMessage());
            }
        } catch (Exception e) {
            logger.error("Error parsing signup request: ", e);
            return ResponseEntity.badRequest().body("Invalid request format: " + e.getMessage());
        }
    }

    @PostMapping("/debug")
    @CrossOrigin(origins = { "http://localhost:3000", "http://localhost:19006",
            "https://frontend-production-c2bc.up.railway.app" })
    public ResponseEntity<?> debugRegisterUser(@RequestBody Object rawRequest) {
        logger.info("Received debug signup request: {}", rawRequest);

        Map<String, Object> debugInfo = new HashMap<>();
        debugInfo.put("raw_request", rawRequest);
        debugInfo.put("request_type", rawRequest.getClass().getName());

        try {
            if (rawRequest instanceof Map) {
                Map<?, ?> requestMap = (Map<?, ?>) rawRequest;
                debugInfo.put("map_keys", requestMap.keySet());

                debugInfo.put("password_length",
                        requestMap.get("password") != null ? ((String) requestMap.get("password")).length() : 0);
            }

            // Try to create a dummy user to see if there are any issues
            User testUser = new User();

            testUser.setEmail("test_" + System.currentTimeMillis() + "@example.com");
            testUser.setPassword(passwordEncoder.encode("test_password"));

            // Don't actually save the test user, just check if it's valid
            debugInfo.put("test_user_valid", true);
        } catch (Exception e) {
            debugInfo.put("error_type", e.getClass().getName());
            debugInfo.put("error_stack", e.getStackTrace());
        }

        // Return debug information
        return ResponseEntity.ok(debugInfo);
    }

    @PostMapping("/google-token")
    @CrossOrigin(origins = { "http://localhost:3000", "http://localhost:19006",
            "https://frontend-production-c2bc.up.railway.app" }, allowCredentials = "true", methods = {
                    RequestMethod.POST, RequestMethod.OPTIONS }, allowedHeaders = { "Content-Type", "Authorization" })
    public ResponseEntity<?> exchangeGoogleToken(@RequestBody Map<String, String> tokenRequest) {
        String googleToken = tokenRequest.get("token");
        logger.info("Received Google token exchange request: {}",
                googleToken != null ? "token present" : "token missing");

        if (googleToken == null || googleToken.isEmpty()) {
            return ResponseEntity.badRequest().body("Google token is required");
        }

        try {
            // Validate Google token by calling Google's tokeninfo endpoint
            String googleResponse = validateGoogleToken(googleToken);

            if (googleResponse == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid Google token");
            }

            // Parse the Google response to get user information
            // This is a simplified example - in production you would use a proper JSON
            // parser
            String email = extractEmailFromGoogleResponse(googleResponse);
            String name = extractNameFromGoogleResponse(googleResponse);

            if (email == null) {
                return ResponseEntity.badRequest().body("Email not found in Google token");
            }

            // Check if user already exists
            Optional<User> existingUser = userRepository.findByEmail(email);
            User user;

            if (existingUser.isPresent()) {
                // User exists, update their information if needed
                user = existingUser.get();
                // You could update user info here if needed
            } else {
                // Create new user with Google information
                user = new User();
                user.setEmail(email);
                user.setUsername(name != null ? name : email.split("@")[0]);
                // Set a random password since they'll use Google to login
                user.setPassword(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
                user.setRoles(List.of("ROLE_USER"));
                user = userRepository.save(user);
                logger.info("Created new user from Google login: {}", email);
            }

            // Generate JWT token
            String token = tokenProvider.generateTokenFromUsername(email, user.getRoles());

            // Create response with user info and token
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("id", user.getId());
            response.put("username", user.getUsername());
            response.put("email", user.getEmail());
            response.put("roles", user.getRoles());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error processing Google token: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error processing Google token: " + e.getMessage());
        }
    }

    // Helper method to validate Google token
    private String validateGoogleToken(String token) {
        try {
            // Call Google's tokeninfo endpoint to validate the token
            URL url = new URL("https://oauth2.googleapis.com/tokeninfo?id_token=" + token);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");

            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                // Read the response
                BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                String inputLine;
                StringBuilder response = new StringBuilder();

                while ((inputLine = in.readLine()) != null) {
                    response.append(inputLine);
                }
                in.close();

                return response.toString();
            } else {
                logger.error("Error validating Google token: HTTP error code: {}", responseCode);
                return null;
            }
        } catch (Exception e) {
            logger.error("Exception validating Google token: ", e);
            return null;
        }
    }

    // Helper method to extract email from Google's response
    private String extractEmailFromGoogleResponse(String response) {
        // This is a very basic extraction. In production, use a proper JSON parser
        // Example: {"email":"user@example.com", ...}
        int emailStart = response.indexOf("\"email\":\"");
        if (emailStart >= 0) {
            emailStart += 9; // Length of "\"email\":\""
            int emailEnd = response.indexOf("\"", emailStart);
            if (emailEnd > emailStart) {
                return response.substring(emailStart, emailEnd);
            }
        }
        return null;
    }

    // Helper method to extract name from Google's response
    private String extractNameFromGoogleResponse(String response) {
        // This is a very basic extraction. In production, use a proper JSON parser
        // Example: {"name":"John Doe", ...}
        int nameStart = response.indexOf("\"name\":\"");
        if (nameStart >= 0) {
            nameStart += 8; // Length of "\"name\":\""
            int nameEnd = response.indexOf("\"", nameStart);
            if (nameEnd > nameStart) {
                return response.substring(nameStart, nameEnd);
            }
        }
        return null;
    }

    @GetMapping("/debug-token")
    public ResponseEntity<?> debugToken(@RequestParam(required = false) String token) {
        Map<String, Object> debug = new HashMap<>();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // Basic debug info
        debug.put("authenticated", authentication != null && authentication.isAuthenticated() &&
                !"anonymousUser".equals(authentication.getName()));
        debug.put("authName", authentication != null ? authentication.getName() : "none");
        debug.put("authType", authentication != null ? authentication.getClass().getSimpleName() : "none");

        // JWT Config info (masked for security)
        debug.put("jwt.secret.length", jwtSecret != null ? jwtSecret.length() : 0);
        debug.put("jwt.secret.preview",
                jwtSecret != null && jwtSecret.length() > 4
                        ? jwtSecret.substring(0, 2) + "..." + jwtSecret.substring(jwtSecret.length() - 2)
                        : "invalid");
        debug.put("jwt.expiration", jwtExpiration);

        // If token provided, validate and decode it
        if (token != null && !token.isEmpty()) {
            try {
                boolean isValid = tokenProvider.validateToken(token);
                debug.put("token.valid", isValid);

                if (isValid) {
                    String email = tokenProvider.getUsernameFromToken(token);
                    debug.put("token.extracted.email", email);

                    // Check if user exists for this token
                    if (email != null) {
                        debug.put("user.exists", userRepository.existsByEmail(email));
                    }
                }
            } catch (Exception e) {
                debug.put("token.error", e.getClass().getSimpleName() + ": " + e.getMessage());
            }
        }

        logger.info("JWT Debug requested: {}", debug);
        return ResponseEntity.ok(debug);
    }
}