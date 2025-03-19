package group_3.tierlistservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.List;
import java.util.ArrayList;

@Data
public class TierlistTemplateRequest {
    @NotBlank(message = "Title is required")
    @Size(min = 1, max = 100, message = "Title must be between 1 and 100 characters")
    private String title;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    @NotNull(message = "Tags cannot be null")
    @Size(max = 10, message = "Cannot have more than 10 tags")
    private List<String> tags = new ArrayList<>();

    @NotNull(message = "Image IDs cannot be null") 
    private List<String> imageIds = new ArrayList<>();
    
    private String thumbnailUrl;
}