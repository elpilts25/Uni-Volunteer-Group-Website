package forum.dipromatiki.dtos;

import java.time.Instant;

public record PostResponse(Long id, String content, String author, Instant createdAt) {}
