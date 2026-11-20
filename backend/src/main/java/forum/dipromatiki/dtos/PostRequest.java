package forum.dipromatiki.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PostRequest(
        @NotBlank(message = "Το μήνυμα είναι υποχρεωτικό")
        @Size(max = 5000, message = "Το μήνυμα δεν μπορεί να ξεπερνά τους 5000 χαρακτήρες")
        String content
) {}
