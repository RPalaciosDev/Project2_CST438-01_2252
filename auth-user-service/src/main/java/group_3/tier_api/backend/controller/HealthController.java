package group_3.tier_api.backend.controller;

import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
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
    private static final Logger logger = LoggerFactory.getLogger(HealthController.class);

    @Value("${spring.application.name:auth-user-service}")
    private String applicationName;

    @Autowired
    private MongoTemplate mongoTemplate;

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
     * MongoDB connectivity check endpoint.
     * Verifies that the application can connect to the MongoDB database.
     */
    @GetMapping("/api/health/db")
    public ResponseEntity<Map<String, Object>> databaseCheck() {
        logger.info("Performing database connectivity check");
        Map<String, Object> response = new HashMap<>();

        try {
            // Attempt to ping the database
            boolean dbStatus = mongoTemplate.getDb().runCommand(new Document("ping", 1)).containsKey("ok");
            response.put("database", dbStatus ? "CONNECTED" : "ERROR");
            response.put("database_name", mongoTemplate.getDb().getName());

            logger.info("Database connectivity check successful: {}", dbStatus);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Database connectivity check failed", e);
            response.put("database", "ERROR");
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
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
        endpoints.put("GET /api/health/db", "MongoDB connectivity check");
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