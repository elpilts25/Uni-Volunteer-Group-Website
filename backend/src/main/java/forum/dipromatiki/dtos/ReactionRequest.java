package forum.dipromatiki.dtos;

import jakarta.validation.constraints.NotBlank;

public record ReactionRequest(
        @NotBlank(message = "Μη έγκυρη αντίδραση")
        String emoji
) {}
