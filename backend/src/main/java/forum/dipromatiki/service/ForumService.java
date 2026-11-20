package forum.dipromatiki.service;

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
import forum.dipromatiki.entity.Category;
import forum.dipromatiki.entity.Post;
import forum.dipromatiki.entity.Reaction;
import forum.dipromatiki.entity.Topic;
import forum.dipromatiki.entity.TopicRead;
import forum.dipromatiki.entity.User;
import forum.dipromatiki.repositories.CategoryRepository;
import forum.dipromatiki.repositories.PostRepository;
import forum.dipromatiki.repositories.ReactionRepository;
import forum.dipromatiki.repositories.TopicReadRepository;
import forum.dipromatiki.repositories.TopicRepository;
import forum.dipromatiki.repositories.UserRepository;
import java.time.Instant;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class ForumService {

    private static final String DEFAULT_ICON = "chat";

    // Reactions are limited to this set; the order is the display order.
    private static final List<String> REACTION_EMOJIS = List.of(
            "\uD83D\uDC4D", "\u2764\uFE0F", "\uD83D\uDE02", "\uD83C\uDF89", "\uD83D\uDE2E", "\uD83D\uDE22");

    private final CategoryRepository categories;
    private final TopicRepository topics;
    private final PostRepository posts;
    private final UserRepository users;
    private final TopicReadRepository topicReads;
    private final ReactionRepository reactions;

    public ForumService(CategoryRepository categories, TopicRepository topics,
                        PostRepository posts, UserRepository users, TopicReadRepository topicReads,
                        ReactionRepository reactions) {
        this.categories = categories;
        this.topics = topics;
        this.posts = posts;
        this.users = users;
        this.topicReads = topicReads;
        this.reactions = reactions;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> listCategories(String username, Collection<String> roles) {
        User viewer = viewer(username);
        return categories.findAll().stream()
                .filter(c -> canAccess(c, roles))
                .map(c -> toResponse(c, viewer))
                .toList();
    }

    @Transactional(readOnly = true)
    public CategoryResponse getCategory(Long id, String username, Collection<String> roles) {
        Category category = findCategory(id);
        requireAccess(category, roles);
        return toResponse(category, viewer(username));
    }

    public CategoryResponse createCategory(CategoryRequest request) {
        String name = request.name().trim();
        if (categories.existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException("Υπάρχει ήδη κατηγορία με αυτό το όνομα");
        }
        Category category = new Category(name, clean(request.description()), iconOrDefault(request.icon()));
        category.setAllowedRoles(request.allowedRoles());
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
        category.setAllowedRoles(request.allowedRoles());
        return toResponse(category, null);
    }

    public void deleteCategory(Long id) {
        categories.delete(findCategory(id));
    }

    @Transactional(readOnly = true)
    public List<TopicSummary> listTopics(Long categoryId, String username, Collection<String> roles) {
        requireAccess(findCategory(categoryId), roles);
        User viewer = viewer(username);
        return topics.findByCategoryIdOrderByCreatedAtDesc(categoryId).stream()
                .map(t -> toSummary(t, viewer))
                .toList();
    }

    public TopicSummary createTopic(Long categoryId, TopicRequest request, String username, Collection<String> roles) {
        Category category = findCategory(categoryId);
        requireAccess(category, roles);
        Topic topic = topics.save(new Topic(
                request.title().trim(), RichText.clean(request.content().trim()), findUser(username), category));
        return toSummary(topic, null);
    }

    @Transactional(readOnly = true)
    public TopicDetail getTopic(Long id, String username, Collection<String> roles) {
        Topic topic = findTopic(id);
        requireAccess(topic.getCategory(), roles);
        List<Post> topicPosts = posts.findByTopicIdOrderByCreatedAtAsc(id);
        Map<Long, List<Reaction>> postReactions = topicPosts.isEmpty() ? Map.of()
                : reactions.findByPostIdIn(topicPosts.stream().map(Post::getId).toList()).stream()
                        .collect(Collectors.groupingBy(r -> r.getPost().getId()));
        List<PostResponse> replies = topicPosts.stream()
                .map(p -> toResponse(p, summarize(postReactions.getOrDefault(p.getId(), List.of()), username)))
                .toList();
        return new TopicDetail(
                topic.getId(), topic.getCategory().getId(), topic.getCategory().getName(),
                topic.getTitle(), topic.getContent(), topic.getAuthor().getUsername(),
                topic.getCreatedAt(), replies, summarize(reactions.findByTopicId(id), username));
    }

    public PostResponse createPost(Long topicId, PostRequest request, String username, Collection<String> roles) {
        Topic topic = findTopic(topicId);
        requireAccess(topic.getCategory(), roles);
        Post post = posts.save(new Post(RichText.clean(request.content().trim()), findUser(username), topic));
        return toResponse(post, List.of());
    }

    // Adds the reaction, or removes it when the user already picked that emoji.
    public List<ReactionSummary> toggleTopicReaction(Long topicId, ReactionRequest request, String username,
                                                     Collection<String> roles) {
        Topic topic = findTopic(topicId);
        requireAccess(topic.getCategory(), roles);
        String emoji = validEmoji(request.emoji());
        User user = findUser(username);
        reactions.findByUserIdAndTopicIdAndEmoji(user.getId(), topicId, emoji).ifPresentOrElse(
                reactions::delete,
                () -> reactions.save(new Reaction(user, topic, null, emoji)));
        reactions.flush();
        return summarize(reactions.findByTopicId(topicId), username);
    }

    public List<ReactionSummary> togglePostReaction(Long postId, ReactionRequest request, String username,
                                                    Collection<String> roles) {
        Post post = findPost(postId);
        requireAccess(post.getTopic().getCategory(), roles);
        String emoji = validEmoji(request.emoji());
        User user = findUser(username);
        reactions.findByUserIdAndPostIdAndEmoji(user.getId(), postId, emoji).ifPresentOrElse(
                reactions::delete,
                () -> reactions.save(new Reaction(user, null, post, emoji)));
        reactions.flush();
        return summarize(reactions.findByPostId(postId), username);
    }

    public TopicSummary updateTopic(Long id, TopicRequest request, String username, boolean admin) {
        Topic topic = findTopic(id);
        requireOwnerOrAdmin(topic.getAuthor(), username, admin);
        topic.setTitle(request.title().trim());
        topic.setContent(RichText.clean(request.content().trim()));
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
        post.setContent(RichText.clean(request.content().trim()));
        return toResponse(post, summarize(reactions.findByPostId(id), username));
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
    public StatsResponse stats(String username, Collection<String> roles) {
        long unread = unreadTopics(username, roles).stream().mapToLong(UnreadTopicSummary::unread).sum();
        return new StatsResponse(users.count(), topics.count(), unread);
    }

    // Newest activity first; only topics in categories the viewer may see.
    @Transactional(readOnly = true)
    public List<UnreadTopicSummary> unreadTopics(String username, Collection<String> roles) {
        User viewer = viewer(username);
        if (viewer == null) return List.of();
        return topics.findUnread(viewer.getId(), readBaseline(viewer)).stream()
                .filter(t -> canAccess(t.getCategory(), roles))
                .map(t -> {
                    TopicSummary s = toSummary(t, viewer);
                    return new UnreadTopicSummary(
                            s.id(), s.title(), s.author(), s.createdAt(), s.replyCount(), s.lastActivity(),
                            s.unread(), t.getCategory().getId(), t.getCategory().getName());
                })
                .sorted(Comparator.comparing(UnreadTopicSummary::lastActivity).reversed())
                .toList();
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
                topics.countByCategoryId(category.getId()), latest(lastTopic, lastPost), unread,
                category.getAllowedRoles());
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

    // Admins always see every category so they can manage the access lists.
    private static boolean canAccess(Category category, Collection<String> roles) {
        return roles.contains("ADMIN") || category.isVisibleTo(roles);
    }

    private static void requireAccess(Category category, Collection<String> roles) {
        if (!canAccess(category, roles)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Δεν έχεις πρόσβαση σε αυτή την κατηγορία");
        }
    }

    private User viewer(String username) {
        return username == null ? null : users.findByUsername(username).orElse(null);
    }

    // Messages from before a user signed up never count as unread.
    private static Instant readBaseline(User user) {
        return user.getCreatedAt() == null ? Instant.EPOCH : user.getCreatedAt();
    }

    private PostResponse toResponse(Post post, List<ReactionSummary> postReactions) {
        return new PostResponse(
                post.getId(), post.getContent(), post.getAuthor().getUsername(), post.getCreatedAt(), postReactions);
    }

    private static String validEmoji(String emoji) {
        if (!REACTION_EMOJIS.contains(emoji)) {
            throw new IllegalArgumentException("Μη έγκυρη αντίδραση");
        }
        return emoji;
    }

    private static List<ReactionSummary> summarize(Collection<Reaction> all, String viewer) {
        return REACTION_EMOJIS.stream().map(emoji -> {
            List<String> names = all.stream()
                    .filter(r -> r.getEmoji().equals(emoji))
                    .map(r -> r.getUser().getUsername())
                    .toList();
            return names.isEmpty() ? null
                    : new ReactionSummary(emoji, names.size(), names.contains(viewer), names);
        }).filter(Objects::nonNull).toList();
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
