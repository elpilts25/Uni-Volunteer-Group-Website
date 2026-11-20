package forum.dipromatiki.repositories;

import forum.dipromatiki.entity.Post;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByTopicIdOrderByCreatedAtAsc(Long topicId);
    long countByTopicId(Long topicId);
    long countByAuthorId(Long authorId);
    Optional<Post> findFirstByTopicIdOrderByCreatedAtDesc(Long topicId);
    Optional<Post> findFirstByTopicCategoryIdOrderByCreatedAtDesc(Long categoryId);

    // A reply is unread if someone else wrote it after `since` and its topic has not been opened since.
    @Query("select count(p) from Post p where p.author.id <> :userId and p.createdAt > :since "
            + "and not exists (select 1 from TopicRead r where r.user.id = :userId and r.topic.id = p.topic.id "
            + "and r.lastReadAt >= p.createdAt)")
    long countUnread(@Param("userId") Long userId, @Param("since") Instant since);

    @Query("select count(p) from Post p where p.topic.category.id = :categoryId and p.author.id <> :userId "
            + "and p.createdAt > :since and not exists (select 1 from TopicRead r where r.user.id = :userId "
            + "and r.topic.id = p.topic.id and r.lastReadAt >= p.createdAt)")
    long countUnreadInCategory(@Param("userId") Long userId, @Param("since") Instant since,
                               @Param("categoryId") Long categoryId);

    @Query("select count(p) from Post p where p.topic.id = :topicId and p.author.id <> :userId "
            + "and p.createdAt > :since and not exists (select 1 from TopicRead r where r.user.id = :userId "
            + "and r.topic.id = p.topic.id and r.lastReadAt >= p.createdAt)")
    long countUnreadInTopic(@Param("userId") Long userId, @Param("since") Instant since,
                            @Param("topicId") Long topicId);
}
