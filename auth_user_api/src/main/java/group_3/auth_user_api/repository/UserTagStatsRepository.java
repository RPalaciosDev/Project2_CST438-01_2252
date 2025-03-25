package group_3.auth_user_api.repository;

import group_3.auth_user_api.model.UserTagStats;
import org.springframework.data.mongodb.repository.MongoRepository;

/**
 * Repository for accessing and manipulating UserTagStats documents
 */
public interface UserTagStatsRepository extends MongoRepository<UserTagStats, String> {

    /**
     * Find user tag stats by user ID
     * 
     * @param userId the user ID
     * @return the UserTagStats for the given user
     */
    UserTagStats findByUserId(String userId);

    /**
     * Check if tag stats exist for a user
     * 
     * @param userId the user ID
     * @return true if stats exist, false otherwise
     */
    boolean existsByUserId(String userId);
}