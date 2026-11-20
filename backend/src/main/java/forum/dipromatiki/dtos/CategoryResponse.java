package forum.dipromatiki.dtos;

import java.time.Instant;
import java.util.List;

public record CategoryResponse(
        Long id,
        String name,
        String description,
        String icon,
        long topicCount,
        Instant lastActivity,
        long unreadCount,
        List<String> allowedRoles
) {}
