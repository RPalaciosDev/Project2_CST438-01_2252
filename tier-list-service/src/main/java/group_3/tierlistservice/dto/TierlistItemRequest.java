package group_3.tierlistservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.List;

@Data
public class TierlistItemRequest {
    @NotBlank(message = "Name is required")
    @Size(min = 1, max = 100, message = "Name must be between 1 and 100 characters")
    private String name;

    @NotBlank(message = "Image URL is required")
    private String imageUrl;

    @Size(max = 10, message = "Cannot have more than 10 tags")
    private List<String> tags;
}