package forum.dipromatiki.repositories;

import forum.dipromatiki.entity.TopicRead;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TopicReadRepository extends JpaRepository<TopicRead, Long> {
    Optional<TopicRead> findByUserIdAndTopicId(Long userId, Long topicId);
}
