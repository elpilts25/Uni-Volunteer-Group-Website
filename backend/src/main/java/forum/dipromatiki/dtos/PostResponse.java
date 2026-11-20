package forum.dipromatiki.dtos;

import java.time.Instant;
import java.util.List;

public record PostResponse(
        Long id, String content, String author, Instant createdAt, List<ReactionSummary> reactions
) {}
