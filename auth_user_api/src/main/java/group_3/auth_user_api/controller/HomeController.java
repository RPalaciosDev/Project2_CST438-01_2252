package group_3.auth_user_api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class HomeController {

    @GetMapping("/")
    public Map<String, String> home() {
        return Map.of(
                "service", "Auth User API",
                "status", "UP",
                "version", "1.0.0");
    }

    @GetMapping("/welcome")
    public Map<String, String> welcome() {
        return Map.of(
                "message", "Welcome to the Auth API",
                "status", "UP",
                "documentation", "See /api/docs for API documentation");
    }
}