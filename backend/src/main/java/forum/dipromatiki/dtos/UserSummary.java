package forum.dipromatiki.dtos;

import java.util.List;

public record UserSummary(Long id, String username, String fullName, String email, List<String> roles) {}
