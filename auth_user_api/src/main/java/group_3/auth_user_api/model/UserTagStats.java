package group_3.auth_user_api.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

/**
 * Model class for tracking user's tag usage history from tier list submissions
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "user_tag_stats")
public class UserTagStats {

    @Id
    private String userId;

    // Map of tag name to count of times it appears in user's tier lists
    private Map<String, Integer> tagCounts;

    // Total number of tier lists submitted by user
    private int totalTierListsSubmitted;

    // Last update timestamp
    private long lastUpdated;

    /**
     * Initialize with default values
     * 
     * @param userId the user ID
     * @return a new UserTagStats instance
     */
    public static UserTagStats initialize(String userId) {
        return UserTagStats.builder()
                .userId(userId)
                .tagCounts(new HashMap<>())
                .totalTierListsSubmitted(0)
                .lastUpdated(System.currentTimeMillis())
                .build();
    }

    /**
     * Update tag counts with new tags from a tier list submission
     * 
     * @param tags array of tags from the tier list
     */
    public void updateTags(String[] tags) {
        if (tags == null || tags.length == 0) {
            return;
        }

        if (tagCounts == null) {
            tagCounts = new HashMap<>();
        }

        for (String tag : tags) {
            if (tag != null && !tag.trim().isEmpty()) {
                String normalizedTag = tag.trim().toLowerCase();
                tagCounts.put(normalizedTag, tagCounts.getOrDefault(normalizedTag, 0) + 1);
            }
        }

        totalTierListsSubmitted++;
        lastUpdated = System.currentTimeMillis();
    }
}