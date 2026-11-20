package forum.dipromatiki.controller;

import forum.dipromatiki.dtos.CategoryRequest;
import forum.dipromatiki.dtos.CategoryResponse;
import forum.dipromatiki.dtos.PostRequest;
import forum.dipromatiki.dtos.PostResponse;
import forum.dipromatiki.dtos.ReactionRequest;
import forum.dipromatiki.dtos.ReactionSummary;
import forum.dipromatiki.dtos.StatsResponse;
import forum.dipromatiki.dtos.TopicDetail;
import forum.dipromatiki.dtos.TopicRequest;
import forum.dipromatiki.dtos.TopicSummary;
import forum.dipromatiki.dtos.UnreadTopicSummary;
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
    public StatsResponse stats(Authentication auth) {
        return forumService.stats(auth.getName(), roles(auth));
    }

    @GetMapping("/topics/unread")
    public List<UnreadTopicSummary> unreadTopics(Authentication auth) {
        return forumService.unreadTopics(auth.getName(), roles(auth));
    }

    @GetMapping("/categories")
    public List<CategoryResponse> listCategories(Authentication auth) {
        return forumService.listCategories(auth.getName(), roles(auth));
    }

    @GetMapping("/categories/{id}")
    public CategoryResponse getCategory(@PathVariable Long id, Authentication auth) {
        return forumService.getCategory(id, auth.getName(), roles(auth));
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
    public List<TopicSummary> listTopics(@PathVariable Long id, Authentication auth) {
        return forumService.listTopics(id, auth.getName(), roles(auth));
    }

    @PostMapping("/categories/{id}/topics")
    public ResponseEntity<TopicSummary> createTopic(@PathVariable Long id,
                                                    @Valid @RequestBody TopicRequest request,
                                                    Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(forumService.createTopic(id, request, auth.getName(), roles(auth)));
    }

    @GetMapping("/topics/{id}")
    public TopicDetail getTopic(@PathVariable Long id, Authentication auth) {
        return forumService.getTopic(id, auth.getName(), roles(auth));
    }

    @PostMapping("/topics/{id}/reactions")
    public List<ReactionSummary> reactToTopic(@PathVariable Long id, @Valid @RequestBody ReactionRequest request,
                                              Authentication auth) {
        return forumService.toggleTopicReaction(id, request, auth.getName(), roles(auth));
    }

    @PostMapping("/posts/{id}/reactions")
    public List<ReactionSummary> reactToPost(@PathVariable Long id, @Valid @RequestBody ReactionRequest request,
                                             Authentication auth) {
        return forumService.togglePostReaction(id, request, auth.getName(), roles(auth));
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

    private static List<String> roles(Authentication auth) {
        return auth.getAuthorities().stream().map(a -> a.getAuthority().replaceFirst("^ROLE_", "")).toList();
    }

    @PostMapping("/topics/{id}/posts")
    public ResponseEntity<PostResponse> createPost(@PathVariable Long id,
                                                   @Valid @RequestBody PostRequest request,
                                                   Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(forumService.createPost(id, request, auth.getName(), roles(auth)));
    }
}
