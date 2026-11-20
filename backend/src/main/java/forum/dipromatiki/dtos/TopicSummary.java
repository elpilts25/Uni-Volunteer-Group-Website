package forum.dipromatiki.dtos;

import java.time.Instant;

public record TopicSummary(
        Long id,
        String title,
        String author,
        Instant createdAt,
        long replyCount,
        Instant lastActivity,
        long unread
) {}
