package group_3.tier_api.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for health check and service info endpoints.
 * These endpoints are useful for monitoring in Railway and other platforms.
 */
@RestController
public class HealthController {

    @Value("${spring.application.name:auth-user-service}")
    private String applicationName;

    private final long startTime = System.currentTimeMillis();

    /**
     * Basic health check endpoint that returns service status.
     * This endpoint is publicly accessible and used by monitoring systems.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", applicationName);
        health.put("uptime", System.currentTimeMillis() - startTime);

        return ResponseEntity.ok(health);
    }

    /**
     * Detailed service information endpoint.
     * This provides more information about the service configuration.
     */
    @GetMapping("/service-info")
    public ResponseEntity<Map<String, Object>> serviceInfo() {
        Map<String, Object> info = new HashMap<>();

        // Basic information
        info.put("service", applicationName);
        info.put("status", "operational");
        info.put("uptime_ms", System.currentTimeMillis() - startTime);
        info.put("version", "1.0.0");

        // Available endpoints
        Map<String, String> endpoints = new HashMap<>();
        endpoints.put("GET /health", "Basic health check");
        endpoints.put("GET /service-info", "Detailed service information");
        endpoints.put("POST /api/auth/signin", "User login");
        endpoints.put("POST /api/auth/signup", "User registration");

        info.put("endpoints", endpoints);

        // System information
        Map<String, Object> system = new HashMap<>();
        system.put("java", System.getProperty("java.version"));
        system.put("os", System.getProperty("os.name"));
        system.put("memory_max", Runtime.getRuntime().maxMemory() / (1024 * 1024) + "MB");
        system.put("memory_free", Runtime.getRuntime().freeMemory() / (1024 * 1024) + "MB");
        system.put("processors", Runtime.getRuntime().availableProcessors());

        info.put("system", system);

        return ResponseEntity.ok(info);
    }
}