package forum.dipromatiki.controller;

import forum.dipromatiki.dtos.UserSummary;
import forum.dipromatiki.entity.User;
import forum.dipromatiki.repositories.UserRepository;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/users")
public class AdminController {

    private final UserRepository userRepository;

    public AdminController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<UserSummary> listUsers() {
        return userRepository.findAll().stream().map(AdminController::toSummary).toList();
    }

    private static UserSummary toSummary(User u) {
        return new UserSummary(u.getId(), u.getUsername(), u.getFullName(), u.getEmail(), u.getRoles());
    }
}
