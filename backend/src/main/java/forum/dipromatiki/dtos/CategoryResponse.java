package forum.dipromatiki.dtos;

import java.time.Instant;

public record CategoryResponse(
        Long id,
        String name,
        String description,
        String icon,
        long topicCount,
        Instant lastActivity,
        long unreadCount
) {}
