package com.group3.chat_api.controller;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private static final Logger log = LoggerFactory.getLogger(UserController.class);

    // In a real implementation, we would inject a service to call the auth API
    // private final UserService userService;

    /**
     * Get a user by ID - currently returns a placeholder response
     * In a production environment, this would call the auth service to get real
     * user data
     * 
     * Note: Handles MongoDB-style ObjectIDs (24-character hex strings)
     */
    @GetMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> getUserById(@PathVariable String userId) {
        log.info("Fetching user details for ID: {}", userId);

        try {
            // PLACEHOLDER IMPLEMENTATION
            // In a real implementation, this would call the auth service API
            // Future enhancement: Replace with actual API call to auth service

            // Generate a consistent username based on first few chars of the ID
            String username = "User_" + (userId.length() >= 4 ? userId.substring(0, 4) : userId);

            Map<String, Object> userResponse = new HashMap<>();
            userResponse.put("id", userId);
            userResponse.put("username", username);
            userResponse.put("email", username.toLowerCase() + "@example.com");

            log.info("Returning placeholder user data for {}: {}", userId, userResponse);
            return ResponseEntity.ok(userResponse);

            // REAL IMPLEMENTATION WOULD BE:
            // return ResponseEntity.ok(userService.getUserById(userId));
        } catch (Exception e) {
            log.error("Error fetching user details for ID {}: {}", userId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}