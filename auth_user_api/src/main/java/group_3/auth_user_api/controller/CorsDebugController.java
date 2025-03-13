package group_3.auth_user_api.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

/**
 * Debug controller for diagnosing CORS issues.
 * This controller provides endpoints that can be used to test CORS
 * configuration.
 */
@RestController
@RequestMapping("/api/auth/debug")
@CrossOrigin(origins = "*", maxAge = 3600)
public class CorsDebugController {

    @Value("${cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    /**
     * Test endpoint to verify CORS configuration
     *
     * @param origin The origin header from the request
     * @return Information about the request and CORS configuration
     */
    @GetMapping("/cors")
    public ResponseEntity<Map<String, Object>> corsDebug(
            @RequestHeader(value = "Origin", required = false) String origin) {

        Map<String, Object> response = new HashMap<>();
        response.put("message", "CORS Debug Endpoint");
        response.put("status", "OK");
        response.put("requestOrigin", origin != null ? origin : "No Origin header");
        response.put("configuredOrigins", Arrays.asList(allowedOrigins.split(",")));
        response.put("would_allow", origin != null &&
                (allowedOrigins.contains(origin) || allowedOrigins.contains("*")));

        return ResponseEntity.ok()
                .header("Access-Control-Allow-Origin", origin != null ? origin : "*")
                .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
                .header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
                .header("Access-Control-Allow-Credentials", "true")
                .body(response);
    }

    /**
     * Simple endpoint to check if authentication service is running
     * This endpoint explicitly sets CORS headers for any origin
     */
    @GetMapping("")
    public ResponseEntity<Map<String, Object>> debug(
            @RequestHeader(value = "Origin", required = false) String origin) {

        Map<String, Object> response = new HashMap<>();
        response.put("service", "auth-user-api");
        response.put("status", "running");
        response.put("cors_debug_enabled", true);

        return ResponseEntity.ok()
                .header("Access-Control-Allow-Origin", origin != null ? origin : "*")
                .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
                .header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
                .body(response);
    }

    /**
     * Preflight response handler explicitly for OPTIONS requests
     */
    @RequestMapping(method = RequestMethod.OPTIONS)
    public ResponseEntity<?> handleOptions(
            @RequestHeader(value = "Origin", required = false) String origin,
            @RequestHeader(value = "Access-Control-Request-Method", required = false) String method) {

        return ResponseEntity.ok()
                .header("Access-Control-Allow-Origin", origin != null ? origin : "*")
                .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
                .header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
                .header("Access-Control-Max-Age", "3600")
                .build();
    }
}