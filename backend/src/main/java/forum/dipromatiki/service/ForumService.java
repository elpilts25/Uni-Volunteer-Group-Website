package forum.dipromatiki.service;

import forum.dipromatiki.dtos.CategoryRequest;
import forum.dipromatiki.dtos.CategoryResponse;
import forum.dipromatiki.dtos.PostRequest;
import forum.dipromatiki.dtos.PostResponse;
import forum.dipromatiki.dtos.StatsResponse;
import forum.dipromatiki.dtos.TopicDetail;
import forum.dipromatiki.dtos.TopicRequest;
import forum.dipromatiki.dtos.TopicSummary;
import forum.dipromatiki.entity.Category;
import forum.dipromatiki.entity.Post;
import forum.dipromatiki.entity.Topic;
import forum.dipromatiki.entity.TopicRead;
import forum.dipromatiki.entity.User;
import forum.dipromatiki.repositories.CategoryRepository;
import forum.dipromatiki.repositories.PostRepository;
import forum.dipromatiki.repositories.TopicReadRepository;
import forum.dipromatiki.repositories.TopicRepository;
import forum.dipromatiki.repositories.UserRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class ForumService {

    private static final String DEFAULT_ICON = "chat";

    private final CategoryRepository categories;
    private final TopicRepository topics;
    private final PostRepository posts;
    private final UserRepository users;
    private final TopicReadRepository topicReads;

    public ForumService(CategoryRepository categories, TopicRepository topics,
                        PostRepository posts, UserRepository users, TopicReadRepository topicReads) {
        this.categories = categories;
        this.topics = topics;
        this.posts = posts;
        this.users = users;
        this.topicReads = topicReads;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> listCategories(String username) {
        User viewer = viewer(username);
        return categories.findAll().stream().map(c -> toResponse(c, viewer)).toList();
    }

    public CategoryResponse createCategory(CategoryRequest request) {
        String name = request.name().trim();
        if (categories.existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException("Υπάρχει ήδη κατηγορία με αυτό το όνομα");
        }
        Category category = new Category(name, clean(request.description()), iconOrDefault(request.icon()));
        return toResponse(categories.save(category), null);
    }

    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = findCategory(id);
        String name = request.name().trim();
        if (categories.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new IllegalArgumentException("Υπάρχει ήδη κατηγορία με αυτό το όνομα");
        }
        category.setName(name);
        category.setDescription(clean(request.description()));
        category.setIcon(iconOrDefault(request.icon()));
        return toResponse(category, null);
    }

    public void deleteCategory(Long id) {
        categories.delete(findCategory(id));
    }

    @Transactional(readOnly = true)
    public List<TopicSummary> listTopics(Long categoryId, String username) {
        findCategory(categoryId);
        User viewer = viewer(username);
        return topics.findByCategoryIdOrderByCreatedAtDesc(categoryId).stream()
                .map(t -> toSummary(t, viewer))
                .toList();
    }

    public TopicSummary createTopic(Long categoryId, TopicRequest request, String username) {
        Category category = findCategory(categoryId);
        Topic topic = topics.save(new Topic(
                request.title().trim(), request.content().trim(), findUser(username), category));
        return toSummary(topic, null);
    }

    @Transactional(readOnly = true)
    public TopicDetail getTopic(Long id) {
        Topic topic = findTopic(id);
        List<PostResponse> replies = posts.findByTopicIdOrderByCreatedAtAsc(id).stream()
                .map(this::toResponse)
                .toList();
        return new TopicDetail(
                topic.getId(), topic.getCategory().getId(), topic.getCategory().getName(),
                topic.getTitle(), topic.getContent(), topic.getAuthor().getUsername(),
                topic.getCreatedAt(), replies);
    }

    public PostResponse createPost(Long topicId, PostRequest request, String username) {
        Topic topic = findTopic(topicId);
        return toResponse(posts.save(new Post(request.content().trim(), findUser(username), topic)));
    }

    public TopicSummary updateTopic(Long id, TopicRequest request, String username, boolean admin) {
        Topic topic = findTopic(id);
        requireOwnerOrAdmin(topic.getAuthor(), username, admin);
        topic.setTitle(request.title().trim());
        topic.setContent(request.content().trim());
        return toSummary(topic, null);
    }

    public void deleteTopic(Long id, String username, boolean admin) {
        Topic topic = findTopic(id);
        requireOwnerOrAdmin(topic.getAuthor(), username, admin);
        topics.delete(topic);
    }

    public PostResponse updatePost(Long id, PostRequest request, String username, boolean admin) {
        Post post = findPost(id);
        requireOwnerOrAdmin(post.getAuthor(), username, admin);
        post.setContent(request.content().trim());
        return toResponse(post);
    }

    public void deletePost(Long id, String username, boolean admin) {
        Post post = findPost(id);
        requireOwnerOrAdmin(post.getAuthor(), username, admin);
        posts.delete(post);
    }

    // Records that the user has now seen everything in the topic. Unknown users are ignored.
    public void markTopicRead(Long topicId, String username) {
        User viewer = viewer(username);
        if (viewer == null) return;
        Topic topic = findTopic(topicId);
        TopicRead read = topicReads.findByUserIdAndTopicId(viewer.getId(), topicId)
                .orElseGet(() -> new TopicRead(viewer, topic));
        read.setLastReadAt(Instant.now());
        topicReads.saveAndFlush(read);
    }

    @Transactional(readOnly = true)
    public StatsResponse stats(String username) {
        User viewer = viewer(username);
        long unread = viewer == null ? 0
                : topics.countUnread(viewer.getId(), readBaseline(viewer))
                + posts.countUnread(viewer.getId(), readBaseline(viewer));
        return new StatsResponse(users.count(), topics.count(), unread);
    }

    private CategoryResponse toResponse(Category category, User viewer) {
        Instant lastTopic = topics.findFirstByCategoryIdOrderByCreatedAtDesc(category.getId())
                .map(Topic::getCreatedAt).orElse(null);
        Instant lastPost = posts.findFirstByTopicCategoryIdOrderByCreatedAtDesc(category.getId())
                .map(Post::getCreatedAt).orElse(null);
        long unread = viewer == null ? 0
                : topics.countUnreadInCategory(viewer.getId(), readBaseline(viewer), category.getId())
                + posts.countUnreadInCategory(viewer.getId(), readBaseline(viewer), category.getId());
        return new CategoryResponse(
                category.getId(), category.getName(), category.getDescription(), category.getIcon(),
                topics.countByCategoryId(category.getId()), latest(lastTopic, lastPost), unread);
    }

    private TopicSummary toSummary(Topic topic, User viewer) {
        Instant lastPost = posts.findFirstByTopicIdOrderByCreatedAtDesc(topic.getId())
                .map(Post::getCreatedAt).orElse(null);
        long unread = viewer == null ? 0
                : topics.countUnreadById(viewer.getId(), readBaseline(viewer), topic.getId())
                + posts.countUnreadInTopic(viewer.getId(), readBaseline(viewer), topic.getId());
        return new TopicSummary(
                topic.getId(), topic.getTitle(), topic.getAuthor().getUsername(), topic.getCreatedAt(),
                posts.countByTopicId(topic.getId()), latest(topic.getCreatedAt(), lastPost), unread);
    }

    private User viewer(String username) {
        return username == null ? null : users.findByUsername(username).orElse(null);
    }

    // Messages from before a user signed up never count as unread.
    private static Instant readBaseline(User user) {
        return user.getCreatedAt() == null ? Instant.EPOCH : user.getCreatedAt();
    }

    private PostResponse toResponse(Post post) {
        return new PostResponse(post.getId(), post.getContent(), post.getAuthor().getUsername(), post.getCreatedAt());
    }

    private static Instant latest(Instant a, Instant b) {
        if (a == null) return b;
        if (b == null) return a;
        return a.isAfter(b) ? a : b;
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static String iconOrDefault(String icon) {
        return icon == null || icon.isBlank() ? DEFAULT_ICON : icon;
    }

    private Category findCategory(Long id) {
        return categories.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Η κατηγορία δεν βρέθηκε"));
    }

    private Topic findTopic(Long id) {
        return topics.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Το θέμα δεν βρέθηκε"));
    }

    private Post findPost(Long id) {
        return posts.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Η απάντηση δεν βρέθηκε"));
    }

    private static void requireOwnerOrAdmin(User author, String username, boolean admin) {
        if (!admin && !author.getUsername().equals(username)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Δεν έχεις δικαίωμα για αυτή την ενέργεια");
        }
    }

    private User findUser(String username) {
        return users.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Μη έγκυρος χρήστης"));
    }
}
