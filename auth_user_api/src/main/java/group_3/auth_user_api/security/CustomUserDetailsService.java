package group_3.auth_user_api.security;

import group_3.auth_user_api.model.User;
import group_3.auth_user_api.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // First try to find by email
        User user = userRepository.findByEmail(username)
                .orElse(null);

        // If not found by email, try by username
        if (user == null) {
            user = userRepository.findByUsername(username)
                    .orElseThrow(
                            () -> new UsernameNotFoundException("User not found with username or email: " + username));
        }

        // Convert custom roles to SimpleGrantedAuthority
        List<SimpleGrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> {
                    // Check if role already has ROLE_ prefix
                    if (!role.startsWith("ROLE_")) {
                        return new SimpleGrantedAuthority("ROLE_" + role);
                    }
                    return new SimpleGrantedAuthority(role);
                })
                .collect(Collectors.toList());

        // Create UserDetails object
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                authorities);
    }
}