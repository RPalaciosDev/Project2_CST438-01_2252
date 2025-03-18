package group_3.auth_user_api.repository;

import group_3.auth_user_api.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    
    List<User> findByGenderAndLookingFor(String gender, String lookingFor);
    List<User> findByAgeGreaterThanEqual(int age);
}
