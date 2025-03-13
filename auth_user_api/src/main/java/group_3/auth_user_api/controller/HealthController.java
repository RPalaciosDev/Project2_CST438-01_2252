package group_3.auth_user_api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;

/**
 * Simple controller to provide health check endpoints for the application.
 * Used by Railway and other monitoring systems to verify the application is
 * running.
 */
@RestController
public class HealthController {

    private static final Logger logger = LoggerFactory.getLogger(HealthController.class);
    private final long startTime = System.currentTimeMillis();

    /**
     * Root path handler for Railway health checks
     * 
     * @return Simple JSON response indicating the service is running
     */
    @GetMapping("/health-root")
    public ResponseEntity<Map<String, Object>> root() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "auth-user-api");
        response.put("message", "Auth service is running");
        return ResponseEntity.ok(response);
    }

    /**
     * Health check endpoint
     * 
     * @return Simple JSON response with service status
     */
    @GetMapping("/health-check")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        logger.info("Health check endpoint accessed");
        long uptime = System.currentTimeMillis() - startTime;

        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "auth-user-api");
        response.put("timestamp", System.currentTimeMillis());
        response.put("uptime_ms", uptime);

        return ResponseEntity.ok(response);
    }

    /**
     * Alternative health check path
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return healthCheck();
    }

    @GetMapping("/actuator/health")
    public ResponseEntity<Map<String, Object>> actuatorHealth() {
        logger.info("Actuator health endpoint accessed");
        return ResponseEntity.ok(Map.of(
                "status", "UP"));
    }
}