package forum.dipromatiki.dtos;

import java.time.Instant;

public record TaskCommentResponse(Long id, String author, String content, Instant createdAt) {}
