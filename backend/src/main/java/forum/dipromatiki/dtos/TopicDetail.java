package forum.dipromatiki.dtos;

import java.time.Instant;
import java.util.List;

public record TopicDetail(
        Long id,
        Long categoryId,
        String categoryName,
        String title,
        String content,
        String author,
        Instant createdAt,
        List<PostResponse> posts
) {}
