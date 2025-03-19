package group_3.tierlistservice.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
@Document(collection = "tierlist_templates")
public class TierlistTemplate {
    @Id
    private String id;

    @NotBlank(message = "User ID is required")
    @Field(name = "userId")
    private String userId;

    @NotBlank(message = "Title is required")
    @Size(min = 1, max = 100, message = "Title must be between 1 and 100 characters")
    @Field(name = "title")
    private String title;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    @Field(name = "description")
    private String description;

    @Field(name = "createdAt")
    private LocalDateTime createdAt;
    
    @Field(name = "updatedAt")
    private LocalDateTime updatedAt;

    @Builder.Default
    @Field(name = "viewCount")
    private int viewCount = 0;

    @Size(max = 10, message = "Cannot have more than 10 tags")
    @Builder.Default
    @Field(name = "tags")
    private List<String> tags = new ArrayList<>();

    @Builder.Default
    @Field(name = "imageIds")
    private List<String> imageIds = new ArrayList<>();
    
    @Field(name = "thumbnailUrl")
    private String thumbnailUrl;
}