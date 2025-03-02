package group_3.tierlistservice.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "tierlists")
public class TierList {
    @Id
    private String id;

    @NotBlank(message = "User ID is required")
    private String userId;

    @NotBlank(message = "Title is required")
    @Size(min = 1, max = 100, message = "Title must be between 1 and 100 characters")
    private String title;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    @NotNull(message = "Tiers list cannot be null")
    @Valid
    private List<Tier> tiers;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean isPublic;

    @Size(max = 10, message = "Cannot have more than 10 tags")
    private List<String> tags;

    private int viewCount;

    @Builder.Default
    private List<String> collaborators = new ArrayList<>();

    @Builder.Default
    private List<String> likes = new ArrayList<>();

    // Nested Tier class
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Tier {
        @NotBlank(message = "Tier name is required")
        @Size(min = 1, max = 50, message = "Tier name must be between 1 and 50 characters")
        private String name;

        @NotBlank(message = "Tier color is required")
        private String color;

        @NotNull(message = "Tier rank is required")
        private int rank;

        @Valid
        private List<TierItem> items;
    }
}