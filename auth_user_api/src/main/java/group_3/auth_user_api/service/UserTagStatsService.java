package group_3.auth_user_api.service;

import group_3.auth_user_api.model.UserTagStats;
import group_3.auth_user_api.repository.UserTagStatsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for managing user tag statistics
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserTagStatsService {

    private final UserTagStatsRepository userTagStatsRepository;

    /**
     * Record tags from a tier list submission for a user
     * 
     * @param userId the user ID
     * @param tags   the tags from the tier list
     * @return the updated UserTagStats
     */
    public UserTagStats recordTags(String userId, List<String> tags) {
        if (userId == null || userId.isEmpty() || tags == null || tags.isEmpty()) {
            log.warn("Invalid parameters for recordTags: userId={}, tags={}", userId, tags);
            return null;
        }

        log.info("Recording {} tags for user {}", tags.size(), userId);

        // Find or create user tag stats
        UserTagStats userTagStats = userTagStatsRepository.findByUserId(userId);
        if (userTagStats == null) {
            userTagStats = UserTagStats.initialize(userId);
            log.info("Created new tag stats record for user {}", userId);
        }

        // Convert List<String> to String[]
        String[] tagArray = tags.toArray(new String[0]);

        // Update tag counts
        userTagStats.updateTags(tagArray);

        // Save and return
        return userTagStatsRepository.save(userTagStats);
    }

    /**
     * Get a user's tag statistics
     * 
     * @param userId the user ID
     * @return the UserTagStats or null if not found
     */
    public UserTagStats getUserTagStats(String userId) {
        return userTagStatsRepository.findByUserId(userId);
    }

    /**
     * Get top tags for a user
     * 
     * @param userId the user ID
     * @param limit  maximum number of tags to return
     * @return map of top tags and their counts
     */
    public Map<String, Integer> getTopTags(String userId, int limit) {
        UserTagStats stats = userTagStatsRepository.findByUserId(userId);
        if (stats == null || stats.getTagCounts() == null || stats.getTagCounts().isEmpty()) {
            return new HashMap<>();
        }

        Map<String, Integer> tagCounts = stats.getTagCounts();

        // Convert to list of entries, sort by count descending
        return tagCounts.entrySet().stream()
                .sorted((e1, e2) -> e2.getValue().compareTo(e1.getValue()))
                .limit(limit)
                .collect(
                        HashMap::new,
                        (map, entry) -> map.put(entry.getKey(), entry.getValue()),
                        HashMap::putAll);
    }
}