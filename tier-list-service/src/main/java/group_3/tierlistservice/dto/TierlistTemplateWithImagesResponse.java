package group_3.tierlistservice.dto;

import lombok.Data;
import lombok.Builder;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class TierlistTemplateWithImagesResponse {
    private String id;
    private String userId;
    private String title;
    private String description;
    private int viewCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<String> tags;
    private List<ImageMetadata> images;

    @Data
    @Builder
    public static class ImageMetadata {
        private String id;
        private String fileName;
        private String s3Url;
        private String uploadedBy;
        private String folder;
    }
}