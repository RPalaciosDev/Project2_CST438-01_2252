package group_3.tierlistservice.dto;

import lombok.Data;
import lombok.Builder;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class TierListResponse {
    private String id;
    private String userId;
    private String title;
    private String description;
    private List<TierResponse> tiers;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean isPublic;
    private List<String> tags;
    private int viewCount;
    private int likesCount;
    private List<String> collaborators;
    private List<String> likes;

    @Data
    @Builder
    public static class TierResponse {
        private String name;
        private String color;
        private int rank;
        private List<TierItemResponse> items;
    }

    @Data
    @Builder
    public static class TierItemResponse {
        private String id;
        private String name;
        private String imageUrl;
        private String description;
        private String type;
        private String category;
        private int position;
    }
}
