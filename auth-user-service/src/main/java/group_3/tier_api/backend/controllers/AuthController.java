package group_3.tier_api.backend.controllers;

import group_3.tier_api.backend.dto.AuthResponse;
import group_3.tier_api.backend.dto.LoginRequest;
import group_3.tier_api.backend.dto.SignupRequest;
import group_3.tier_api.backend.models.Role;
import group_3.tier_api.backend.models.User;
import group_3.tier_api.backend.repositories.UserRepository;
import group_3.tier_api.backend.security.JwtUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = {
                "https://frontend-production-c2bc.up.railway.app",
                "https://imageapi-production-af11.up.railway.app",
                "https://lovetiers.com",
                // The following HTTP URLs are only for local development
                "http://localhost:19006",
                "http://localhost:3000"
}, allowCredentials = "true", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
        private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

        @Autowired
        private AuthenticationManager authenticationManager;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private PasswordEncoder encoder;

        @Autowired
        private JwtUtils jwtUtils;

        @PostMapping("/signin")
        public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
                Authentication authentication = authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(),
                                                loginRequest.getPassword()));

                SecurityContextHolder.getContext().setAuthentication(authentication);
                String jwt = jwtUtils.generateJwtToken(authentication);

                org.springframework.security.core.userdetails.UserDetails userDetails = (org.springframework.security.core.userdetails.UserDetails) authentication
                                .getPrincipal();

                List<String> roles = userDetails.getAuthorities().stream()
                                .map(item -> item.getAuthority())
                                .collect(Collectors.toList());

                User user = userRepository.findByUsername(userDetails.getUsername()).orElseThrow();

                return ResponseEntity.ok(new AuthResponse(
                                jwt,
                                user.getId(),
                                user.getUsername(),
                                user.getEmail(),
                                roles));
        }

        @PostMapping("/signup")
        public ResponseEntity<?> registerUser(@RequestBody SignupRequest signUpRequest) {
                try {
                        logger.info("Received signup request for username: {}, email: {}",
                                        signUpRequest.getUsername(), signUpRequest.getEmail());

                        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
                                logger.warn("Username already taken: {}", signUpRequest.getUsername());
                                return ResponseEntity
                                                .badRequest()
                                                .body("Error: Username is already taken!");
                        }

                        // Check if email is already in use
                        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
                                logger.warn("Email already in use: {}", signUpRequest.getEmail());
                                return ResponseEntity
                                                .badRequest()
                                                .body("Error: Email is already in use!");
                        }

                        logger.info("Creating new user with username: {}", signUpRequest.getUsername());
                        User user = new User(
                                        signUpRequest.getUsername(),
                                        signUpRequest.getEmail(),
                                        encoder.encode(signUpRequest.getPassword()));

                        if (signUpRequest.getFullName() != null) {
                                user.setFullName(signUpRequest.getFullName());
                                logger.info("Setting full name: {}", signUpRequest.getFullName());
                        }

                        user.addRole(Role.ROLE_USER);
                        logger.info("Added ROLE_USER to user");

                        if (signUpRequest.getRoles() != null && signUpRequest.getRoles().contains("ROLE_ADMIN")) {
                                user.addRole(Role.ROLE_ADMIN);
                                logger.info("Added ROLE_ADMIN to user");
                        }

                        if (signUpRequest.getRoles() != null && signUpRequest.getRoles().contains("ROLE_MODERATOR")) {
                                user.addRole(Role.ROLE_MODERATOR);
                                logger.info("Added ROLE_MODERATOR to user");
                        }

                        logger.info("Saving user to database");
                        userRepository.save(user);
                        logger.info("User saved successfully with ID: {}", user.getId());

                        return ResponseEntity.ok("User registered successfully!");
                } catch (Exception e) {
                        logger.error("Error registering user: ", e);
                        return ResponseEntity
                                        .internalServerError()
                                        .body("Error registering user: " + e.getMessage());
                }
        }

        @PostMapping("/register")
        public ResponseEntity<?> registerUserAlias(@RequestBody SignupRequest signUpRequest) {
                logger.info("Received register request - forwarding to /signup endpoint");
                return registerUser(signUpRequest); // Calls the existing /signup method
        }

        @GetMapping("/me")
        public ResponseEntity<?> getCurrentUser() {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                String username = authentication.getName();

                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException("Error: User not found."));

                List<String> roles = user.getRoles().stream()
                                .map(Role::name)
                                .collect(Collectors.toList());

                return ResponseEntity.ok(new AuthResponse(
                                null,
                                user.getId(),
                                user.getUsername(),
                                user.getEmail(),
                                roles));
        }
}
