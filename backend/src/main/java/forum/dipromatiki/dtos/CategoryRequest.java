package forum.dipromatiki.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
        @NotBlank(message = "Το όνομα της κατηγορίας είναι υποχρεωτικό")
        @Size(max = 60, message = "Το όνομα της κατηγορίας δεν μπορεί να ξεπερνά τους 60 χαρακτήρες")
        String name,

        @Size(max = 200, message = "Η περιγραφή δεν μπορεί να ξεπερνά τους 200 χαρακτήρες")
        String description,

        @Pattern(regexp = "^[a-z]{1,20}$", message = "Μη έγκυρο εικονίδιο")
        String icon
) {}
