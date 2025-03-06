package group_3.tierlistservice.repository;

import group_3.tierlistservice.model.TierlistItem;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TierlistItemRepository extends MongoRepository<TierlistItem, String> {
    List<TierlistItem> findByCreatedBy(String createdBy);

    List<TierlistItem> findByNameContainingIgnoreCase(String name);

    List<TierlistItem> findByTagsContaining(String tag);

    List<TierlistItem> findByIdIn(List<String> ids);
}