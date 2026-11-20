package forum.dipromatiki.security;

import forum.dipromatiki.entity.User;
import forum.dipromatiki.repositories.UserRepository;
import java.time.LocalDate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Value("${dipromatiki.admin.username}")
    private String username;

    @Value("${dipromatiki.admin.email}")
    private String email;

    @Value("${dipromatiki.admin.password}")
    private String password;

    public AdminInitializer(UserRepository userRepository, BCryptPasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Roles renamed when the role set was extended.
        userRepository.replaceRole("USER", "OBSERVER");
        userRepository.replaceRole("MEMBER", "FULL_MEMBER");

        if (userRepository.existsByUsername(username) || userRepository.existsByEmail(email)) {
            return;
        }
        userRepository.save(new User(
                username, "Administrator", email, "-", "0000000000",
                LocalDate.of(1990, 1, 1), passwordEncoder.encode(password), "ADMIN"));
    }
}
