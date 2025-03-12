package group_3.tier_api.backend.controller;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class UserController {

    private final StringRedisTemplate redisTemplate;

    public UserController(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    // Root API endpoint
    @GetMapping("/")
    public String home() {
        return "Welcome to the API! Try /api/hello";
    }

    // Test endpoint
    @GetMapping("/hello")
    public String hello() {
        return "Hello from Spring Boot!";
    }

    // Store data in Redis
    @PostMapping("/cache/{key}/{value}")
    public String cacheData(@PathVariable String key, @PathVariable String value) {
        redisTemplate.opsForValue().set(key, value);
        return "Cached " + key + " = " + value;
    }

    // Retrieve data from Redis
    @GetMapping("/cache/{key}")
    public String getCachedData(@PathVariable String key) {
        String value = redisTemplate.opsForValue().get(key);
        return (value != null) ? "Value: " + value : "Key not found in cache";
    }
}