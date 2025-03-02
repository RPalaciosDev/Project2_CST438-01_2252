package group_3.tierlistservice.repository;

import group_3.tierlistservice.model.TierList;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TierListRepository extends MongoRepository<TierList, String> {
    List<TierList> findByUserId(String userId);

    List<TierList> findByIsPublicTrue();

    List<TierList> findByTitleContainingIgnoreCase(String title);

    List<TierList> findByTagsContaining(String tag);

    List<TierList> findByCollaboratorsContaining(String userId);
}