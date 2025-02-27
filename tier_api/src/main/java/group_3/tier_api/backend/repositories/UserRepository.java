package group_3.tier_api.backend.repositories;

import group_3.tier_api.backend.models.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    
    // Find by username
    Optional<User> findByUsername(String username);
    
    // Find by email
    Optional<User> findByEmail(String email);
    
    // Find by provider and providerId for OAuth
    Optional<User> findByProviderAndProviderId(String provider, String providerId);
    
    // Check if user exists by username
    boolean existsByUsername(String username);
    
    // Check if user exists by email
    boolean existsByEmail(String email);
}