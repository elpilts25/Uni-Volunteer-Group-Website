package forum.dipromatiki.repositories;

import forum.dipromatiki.entity.Reaction;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReactionRepository extends JpaRepository<Reaction, Long> {
    List<Reaction> findByTopicId(Long topicId);
    List<Reaction> findByPostId(Long postId);
    List<Reaction> findByPostIdIn(Collection<Long> postIds);
    Optional<Reaction> findByUserIdAndTopicIdAndEmoji(Long userId, Long topicId, String emoji);
    Optional<Reaction> findByUserIdAndPostIdAndEmoji(Long userId, Long postId, String emoji);
}
