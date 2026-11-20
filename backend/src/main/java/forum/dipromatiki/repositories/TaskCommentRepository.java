package forum.dipromatiki.repositories;

import forum.dipromatiki.entity.TaskComment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskCommentRepository extends JpaRepository<TaskComment, Long> {
}
