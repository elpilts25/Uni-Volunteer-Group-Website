package forum.dipromatiki.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TopicRequest(
        @NotBlank(message = "Ο τίτλος είναι υποχρεωτικός")
        @Size(max = 150, message = "Ο τίτλος δεν μπορεί να ξεπερνά τους 150 χαρακτήρες")
        String title,

        @NotBlank(message = "Το μήνυμα είναι υποχρεωτικό")
        @Size(max = 20000, message = "Το μήνυμα δεν μπορεί να ξεπερνά τους 20000 χαρακτήρες")
        String content
) {}
