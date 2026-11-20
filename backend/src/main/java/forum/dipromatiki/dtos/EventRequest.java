package forum.dipromatiki.dtos;

import forum.dipromatiki.entity.EventType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalTime;

public record EventRequest(
        @NotBlank(message = "Ο τίτλος είναι υποχρεωτικός")
        @Size(max = 150, message = "Ο τίτλος δεν μπορεί να ξεπερνά τους 150 χαρακτήρες")
        String title,

        @NotNull(message = "Ο τύπος είναι υποχρεωτικός")
        EventType type,

        @NotNull(message = "Η ημερομηνία είναι υποχρεωτική")
        LocalDate date,

        @NotNull(message = "Η ώρα είναι υποχρεωτική")
        LocalTime time,

        @Size(max = 200, message = "Η τοποθεσία δεν μπορεί να ξεπερνά τους 200 χαρακτήρες")
        String location
) {}
