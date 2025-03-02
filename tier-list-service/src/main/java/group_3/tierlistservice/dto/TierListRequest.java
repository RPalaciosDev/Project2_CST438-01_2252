package group_3.tierlistservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.Valid;
import lombok.Data;
import java.util.List;

@Data
public class TierListRequest {
    @NotBlank(message = "Title is required")
    @Size(min = 1, max = 100, message = "Title must be between 1 and 100 characters")
    private String title;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    @NotNull(message = "Tiers list cannot be null")
    @Valid
    private List<TierRequest> tiers;

    private boolean isPublic;

    @Size(max = 10, message = "Cannot have more than 10 tags")
    private List<String> tags;

    private List<String> collaborators;

    @Data
    public static class TierRequest {
        @NotBlank(message = "Tier name is required")
        @Size(min = 1, max = 50, message = "Tier name must be between 1 and 50 characters")
        private String name;

        @NotBlank(message = "Tier color is required")
        private String color;

        @NotNull(message = "Tier rank is required")
        private int rank;

        @Valid
        private List<TierItemRequest> items;
    }

    @Data
    public static class TierItemRequest {
        @NotBlank(message = "Item name is required")
        @Size(min = 1, max = 100, message = "Item name must be between 1 and 100 characters")
        private String name;

        @NotBlank(message = "Image URL is required")
        private String imageUrl;

        @Size(max = 500, message = "Description cannot exceed 500 characters")
        private String description;

        @NotBlank(message = "Item type is required")
        private String type;

        private String category;

        private int position;
    }
}