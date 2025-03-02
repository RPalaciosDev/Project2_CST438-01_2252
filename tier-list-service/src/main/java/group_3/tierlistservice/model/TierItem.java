package group_3.tierlistservice.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TierItem {
    private String id;

    @NotBlank(message = "Item name is required")
    @Size(min = 1, max = 100, message = "Item name must be between 1 and 100 characters")
    private String name;

    @NotBlank(message = "Image URL is required")
    private String imageUrl;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    @NotBlank(message = "Item type is required")
    private String type; // e.g., "character", "game", "movie", etc.

    private String category; // For grouping similar items

    @Min(value = 0, message = "Position cannot be negative")
    private int position; // Position within the tier
}