package forum.dipromatiki.dtos;

import forum.dipromatiki.entity.TaskPriority;
import forum.dipromatiki.entity.TaskStatus;
import forum.dipromatiki.entity.TaskTeam;
import java.time.LocalDate;
import java.util.List;

public record TaskDetail(
        Long id,
        String code,
        TaskTeam team,
        String title,
        String description,
        TaskStatus status,
        TaskPriority priority,
        LocalDate dueDate,
        String createdBy,
        List<AssigneeResponse> assignees,
        List<CriterionResponse> criteria,
        List<TaskCommentResponse> comments
) {}
