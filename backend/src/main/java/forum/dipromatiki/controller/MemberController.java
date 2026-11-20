package forum.dipromatiki.controller;

import forum.dipromatiki.dtos.MemberResponse;
import forum.dipromatiki.dtos.RoleRequest;
import forum.dipromatiki.entity.User;
import forum.dipromatiki.repositories.PostRepository;
import forum.dipromatiki.repositories.TopicRepository;
import forum.dipromatiki.repositories.UserRepository;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class MemberController {

    private final UserRepository users;
    private final TopicRepository topics;
    private final PostRepository posts;

    public MemberController(UserRepository users, TopicRepository topics, PostRepository posts) {
        this.users = users;
        this.topics = topics;
        this.posts = posts;
    }

    // Contact details (email, phone, ...) are deliberately left out.
    @GetMapping("/members")
    @Transactional(readOnly = true)
    public List<MemberResponse> listMembers() {
        return users.findAll().stream().map(this::toResponse).toList();
    }

    @PutMapping("/members/{id}/roles")
    public MemberResponse changeRole(@PathVariable Long id, @Valid @RequestBody RoleRequest request,
                                     Authentication auth) {
        User user = users.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ο χρήστης δεν βρέθηκε"));
        boolean admin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        // Board members can't create, demote or otherwise touch admins.
        if (!admin && (user.getRoles().contains("ADMIN") || request.roles().contains("ADMIN"))) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Μόνο ο διαχειριστής μπορεί να διαχειριστεί τον ρόλο Admin");
        }
        // The app must always keep at least one admin.
        if (user.getRoles().contains("ADMIN") && !request.roles().contains("ADMIN")
                && users.findAll().stream().filter(u -> u.getRoles().contains("ADMIN")).count() <= 1) {
            throw new IllegalArgumentException("Πρέπει να υπάρχει τουλάχιστον ένας Admin");
        }
        user.setRoles(request.roles());
        return toResponse(users.save(user));
    }

    private MemberResponse toResponse(User u) {
        return new MemberResponse(
                u.getId(), u.getUsername(), u.getFullName(), u.getRoles(), u.getCreatedAt(),
                topics.countByAuthorId(u.getId()), posts.countByAuthorId(u.getId()));
    }
}
