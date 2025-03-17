package group_3.auth_user_api.controller;

import group_3.auth_user_api.model.User;
import group_3.auth_user_api.repository.UserRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Fetch logged-in user info
    @GetMapping("/me")
    public Optional<User> getCurrentUser(@AuthenticationPrincipal OAuth2User principal) {
        String email = principal.getAttribute("email");
        return userRepository.findByEmail(email);
    }

    // Get all users (optional)
    @GetMapping("/all")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Update profile fields: sex, lookingFor, age
    @PutMapping("/update-profile")
    public Optional<User> updateProfile(@AuthenticationPrincipal OAuth2User principal, @RequestBody User updatedUser) {
        String email = principal.getAttribute("email");
        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            user.setSex(updatedUser.getSex());
            user.setLookingFor(updatedUser.getLookingFor());
            user.setAge(updatedUser.getAge());
            return Optional.of(userRepository.save(user));
        }
        return Optional.empty();
    }
}
