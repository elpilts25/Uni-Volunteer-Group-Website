package forum.dipromatiki.dtos;

import java.time.Instant;
import java.util.List;

public record MemberResponse(
        Long id, String username, String fullName, List<String> roles,
        Instant joinedAt, long topicCount, long replyCount
) {}
