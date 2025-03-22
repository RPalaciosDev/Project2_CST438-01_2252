package group_3.tierlistservice.repository;

import group_3.tierlistservice.model.TierlistCompletion;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TierlistCompletionRepository extends MongoRepository<TierlistCompletion, String> {
    /**
     * Find a completion record for a specific user and template
     */
    Optional<TierlistCompletion> findByUserIdAndTemplateId(String userId, String templateId);

    /**
     * Check if a specific user has completed a specific template
     */
    boolean existsByUserIdAndTemplateId(String userId, String templateId);
}