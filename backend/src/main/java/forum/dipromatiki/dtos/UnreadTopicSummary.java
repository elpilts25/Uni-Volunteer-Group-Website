package forum.dipromatiki.dtos;

import java.time.Instant;

// A discussion with messages the viewer has not read yet.
public record UnreadTopicSummary(
        Long id,
        String title,
        String author,
        Instant createdAt,
        long replyCount,
        Instant lastActivity,
        long unread,
        Long categoryId,
        String categoryName
) {}
