package group_3.auth_user_api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;
import java.time.Instant;

@RestController
public class HealthController {

    private final long startTime = System.currentTimeMillis();

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        long uptime = System.currentTimeMillis() - startTime;

        Map<String, Object> response = Map.of(
                "status", "UP",
                "service", "auth-user-api",
                "timestamp", Instant.now().toString(),
                "uptime_ms", uptime);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/actuator/health")
    public ResponseEntity<Map<String, Object>> actuatorHealth() {
        return ResponseEntity.ok(Map.of(
                "status", "UP"));
    }

    // Railway often checks root path, but we'll use a different path to avoid
    // conflicts
    @GetMapping("/health-check")
    public ResponseEntity<String> root() {
        return ResponseEntity.ok("Auth User API Service is running.");
    }
}