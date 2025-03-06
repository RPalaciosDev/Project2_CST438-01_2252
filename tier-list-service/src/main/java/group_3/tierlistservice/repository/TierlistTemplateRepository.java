package group_3.tierlistservice.repository;

import group_3.tierlistservice.model.TierlistTemplate;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TierlistTemplateRepository extends MongoRepository<TierlistTemplate, String> {
    List<TierlistTemplate> findByUserId(String userId);

    List<TierlistTemplate> findByTitleContainingIgnoreCase(String title);

    List<TierlistTemplate> findByTagsContaining(String tag);
}