package group_3.auth_user_api.controller;

import group_3.auth_user_api.model.User;
import group_3.auth_user_api.repository.UserRepository;
import group_3.auth_user_api.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@RequestBody Map<String, String> loginRequest) {
        String username = loginRequest.get("username");
        String password = loginRequest.get("password");

        // First, try to find user by username
        Optional<User> userOptional = userRepository.findByUsername(username);

        // If not found, try by email
        if (userOptional.isEmpty()) {
            userOptional = userRepository.findByEmail(username);
        }

        if (userOptional.isPresent()) {
            User user = userOptional.get();

            // Check if password matches
            if (passwordEncoder.matches(password, user.getPassword())) {
                // Generate JWT token
                String token = jwtUtil.generateToken(user.getEmail());

                // Create response with user info and token
                Map<String, Object> response = new HashMap<>();
                response.put("token", token);
                response.put("id", user.getId());
                response.put("username", user.getUsername());
                response.put("email", user.getEmail());
                response.put("roles", user.getRoles());

                return ResponseEntity.ok(response);
            }
        }

        return ResponseEntity.status(401).body("Invalid username or password");
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> signupRequest) {
        String username = signupRequest.get("username");
        String email = signupRequest.get("email");
        String password = signupRequest.get("password");

        // Check if username already exists
        if (userRepository.existsByUsername(username)) {
            return ResponseEntity.badRequest().body("Username is already taken");
        }

        // Check if email already exists
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body("Email is already in use");
        }

        // Create new user using no-args constructor and setters
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRoles(java.util.List.of("ROLE_USER"));

        // Save user to database
        userRepository.save(user);

        return ResponseEntity.ok("User registered successfully");
    }
}