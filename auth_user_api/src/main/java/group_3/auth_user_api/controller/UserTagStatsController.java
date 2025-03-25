package group_3.auth_user_api.controller;

import group_3.auth_user_api.model.UserTagStats;
import group_3.auth_user_api.service.UserTagStatsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for user tag statistics
 */
@RestController
@RequestMapping("/api/user/tags")
@RequiredArgsConstructor
@Slf4j
public class UserTagStatsController {

    private final UserTagStatsService userTagStatsService;

    /**
     * Record tags from a tier list submission
     * 
     * @param userId      the user ID
     * @param requestBody the request body containing tags
     * @return status and updated tag statistics
     */
    @PostMapping("/record/{userId}")
    public ResponseEntity<?> recordTags(
            @PathVariable String userId,
            @RequestBody Map<String, Object> requestBody) {

        try {
            @SuppressWarnings("unchecked")
            List<String> tags = (List<String>) requestBody.get("tags");

            if (tags == null || tags.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "No tags provided"));
            }

            UserTagStats stats = userTagStatsService.recordTags(userId, tags);

            if (stats == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Failed to record tags"));
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Successfully recorded tags",
                    "tagCount", stats.getTagCounts().size(),
                    "totalSubmissions", stats.getTotalTierListsSubmitted()));

        } catch (Exception e) {
            log.error("Error recording tags for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error recording tags: " + e.getMessage()));
        }
    }

    /**
     * Get tag statistics for a user
     * 
     * @param userId the user ID
     * @return the user's tag statistics
     */
    @GetMapping("/{userId}")
    public ResponseEntity<?> getUserTagStats(@PathVariable String userId) {
        try {
            UserTagStats stats = userTagStatsService.getUserTagStats(userId);

            if (stats == null) {
                return ResponseEntity.ok(UserTagStats.initialize(userId));
            }

            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            log.error("Error getting tag stats for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error getting tag stats: " + e.getMessage()));
        }
    }

    /**
     * Get top tags for a user
     * 
     * @param userId the user ID
     * @param limit  maximum number of tags to return (optional, default 10)
     * @return map of top tags and their counts
     */
    @GetMapping("/top/{userId}")
    public ResponseEntity<?> getTopTags(
            @PathVariable String userId,
            @RequestParam(defaultValue = "10") int limit) {

        try {
            Map<String, Integer> topTags = userTagStatsService.getTopTags(userId, limit);
            return ResponseEntity.ok(Map.of("userId", userId, "topTags", topTags));

        } catch (Exception e) {
            log.error("Error getting top tags for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error getting top tags: " + e.getMessage()));
        }
    }
}