package group_3.tierlistservice.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.time.LocalDateTime;

/**
 * Represents a record of a user completing a tierlist
 * Used for tracking daily tierlist completions
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "tierlist_completions")
@CompoundIndex(name = "user_template_idx", def = "{'userId': 1, 'templateId': 1}")
public class TierlistCompletion {
    @Id
    private String id;

    @Field(name = "userId")
    private String userId;

    @Field(name = "templateId")
    private String templateId;

    @Field(name = "completedAt")
    private LocalDateTime completedAt;
}