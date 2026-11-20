package forum.dipromatiki.repositories;

import forum.dipromatiki.entity.Topic;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TopicRepository extends JpaRepository<Topic, Long> {
    List<Topic> findByCategoryIdOrderByCreatedAtDesc(Long categoryId);
    long countByCategoryId(Long categoryId);
    long countByAuthorId(Long authorId);
    Optional<Topic> findFirstByCategoryIdOrderByCreatedAtDesc(Long categoryId);

    // A topic's opening post is unread if someone else wrote it after `since` and it has not been opened since.
    @Query("select count(t) from Topic t where t.author.id <> :userId and t.createdAt > :since "
            + "and not exists (select 1 from TopicRead r where r.user.id = :userId and r.topic.id = t.id "
            + "and r.lastReadAt >= t.createdAt)")
    long countUnread(@Param("userId") Long userId, @Param("since") Instant since);

    @Query("select count(t) from Topic t where t.category.id = :categoryId and t.author.id <> :userId "
            + "and t.createdAt > :since and not exists (select 1 from TopicRead r where r.user.id = :userId "
            + "and r.topic.id = t.id and r.lastReadAt >= t.createdAt)")
    long countUnreadInCategory(@Param("userId") Long userId, @Param("since") Instant since,
                               @Param("categoryId") Long categoryId);

    @Query("select count(t) from Topic t where t.id = :topicId and t.author.id <> :userId "
            + "and t.createdAt > :since and not exists (select 1 from TopicRead r where r.user.id = :userId "
            + "and r.topic.id = t.id and r.lastReadAt >= t.createdAt)")
    long countUnreadById(@Param("userId") Long userId, @Param("since") Instant since,
                         @Param("topicId") Long topicId);
}
