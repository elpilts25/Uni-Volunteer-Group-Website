package forum.dipromatiki.dtos;

import java.util.List;

// `users` lists everyone who picked the emoji; `reacted` tells whether the viewer is one of them.
public record ReactionSummary(String emoji, long count, boolean reacted, List<String> users) {}
