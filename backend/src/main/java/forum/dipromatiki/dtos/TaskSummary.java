package forum.dipromatiki.dtos;

import forum.dipromatiki.entity.TaskPriority;
import forum.dipromatiki.entity.TaskStatus;
import forum.dipromatiki.entity.TaskTeam;
import java.time.LocalDate;
import java.util.List;

public record TaskSummary(
        Long id,
        String code,
        TaskTeam team,
        String title,
        TaskStatus status,
        TaskPriority priority,
        LocalDate dueDate,
        int commentCount,
        List<AssigneeResponse> assignees,
        int criteriaDone,
        int criteriaTotal
) {}
