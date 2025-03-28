package group_3.tierlistservice.dto;

import lombok.Data;
import lombok.Builder;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class TierlistTemplateResponse {
    private String id;
    private String title;
    private String description;
    private int viewCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<String> tags;
    private String thumbnailUrl;
    private LocalDate wasDailyList;
    private boolean isCurrentDailyList;
}