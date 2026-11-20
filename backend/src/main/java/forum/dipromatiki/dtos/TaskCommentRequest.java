package forum.dipromatiki.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TaskCommentRequest(
        @NotBlank(message = "Το σχόλιο είναι υποχρεωτικό")
        @Size(max = 2000, message = "Το σχόλιο δεν μπορεί να ξεπερνά τους 2000 χαρακτήρες")
        String content
) {}
