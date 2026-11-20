package forum.dipromatiki.controller;

import forum.dipromatiki.dtos.CategoryRequest;
import forum.dipromatiki.dtos.CategoryResponse;
import forum.dipromatiki.dtos.PostRequest;
import forum.dipromatiki.dtos.PostResponse;
import forum.dipromatiki.dtos.StatsResponse;
import forum.dipromatiki.dtos.TopicDetail;
import forum.dipromatiki.dtos.TopicRequest;
import forum.dipromatiki.dtos.TopicSummary;
import forum.dipromatiki.service.ForumService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
public class ForumController {

    private final ForumService forumService;

    public ForumController(ForumService forumService) {
        this.forumService = forumService;
    }

    @GetMapping("/stats")
    public StatsResponse stats(Principal principal) {
        return forumService.stats(principal.getName());
    }

    @GetMapping("/categories")
    public List<CategoryResponse> listCategories(Principal principal) {
        return forumService.listCategories(principal.getName());
    }

    @PostMapping("/categories")
    public ResponseEntity<CategoryResponse> createCategory(@Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(forumService.createCategory(request));
    }

    @PutMapping("/categories/{id}")
    public CategoryResponse updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        return forumService.updateCategory(id, request);
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        forumService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/categories/{id}/topics")
    public List<TopicSummary> listTopics(@PathVariable Long id, Principal principal) {
        return forumService.listTopics(id, principal.getName());
    }

    @PostMapping("/categories/{id}/topics")
    public ResponseEntity<TopicSummary> createTopic(@PathVariable Long id,
                                                    @Valid @RequestBody TopicRequest request,
                                                    Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(forumService.createTopic(id, request, principal.getName()));
    }

    @GetMapping("/topics/{id}")
    public TopicDetail getTopic(@PathVariable Long id) {
        return forumService.getTopic(id);
    }

    @PostMapping("/topics/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long id, Principal principal) {
        try {
            forumService.markTopicRead(id, principal.getName());
        } catch (DataIntegrityViolationException e) {
            // Two tabs marked the topic at once; the other request already recorded it.
        }
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/topics/{id}")
    public TopicSummary updateTopic(@PathVariable Long id, @Valid @RequestBody TopicRequest request,
                                    Authentication auth) {
        return forumService.updateTopic(id, request, auth.getName(), isAdmin(auth));
    }

    @DeleteMapping("/topics/{id}")
    public ResponseEntity<Void> deleteTopic(@PathVariable Long id, Authentication auth) {
        forumService.deleteTopic(id, auth.getName(), isAdmin(auth));
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/posts/{id}")
    public PostResponse updatePost(@PathVariable Long id, @Valid @RequestBody PostRequest request,
                                   Authentication auth) {
        return forumService.updatePost(id, request, auth.getName(), isAdmin(auth));
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id, Authentication auth) {
        forumService.deletePost(id, auth.getName(), isAdmin(auth));
        return ResponseEntity.noContent().build();
    }

    private static boolean isAdmin(Authentication auth) {
        return auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    @PostMapping("/topics/{id}/posts")
    public ResponseEntity<PostResponse> createPost(@PathVariable Long id,
                                                   @Valid @RequestBody PostRequest request,
                                                   Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(forumService.createPost(id, request, principal.getName()));
    }
}
