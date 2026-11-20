package forum.dipromatiki.dtos;

import forum.dipromatiki.entity.TaskPriority;
import forum.dipromatiki.entity.TaskTeam;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

public record TaskRequest(
        @NotNull(message = "Η ομάδα είναι υποχρεωτική")
        TaskTeam team,

        @NotBlank(message = "Ο τίτλος είναι υποχρεωτικός")
        @Size(max = 150, message = "Ο τίτλος δεν μπορεί να ξεπερνά τους 150 χαρακτήρες")
        String title,

        @Size(max = 2000, message = "Η περιγραφή δεν μπορεί να ξεπερνά τους 2000 χαρακτήρες")
        String description,

        @NotNull(message = "Η προτεραιότητα είναι υποχρεωτική")
        TaskPriority priority,

        LocalDate dueDate,

        @Size(max = 20, message = "Έως 20 κριτήρια αποδοχής")
        List<@NotBlank(message = "Το κριτήριο δεν μπορεί να είναι κενό")
             @Size(max = 200, message = "Το κριτήριο δεν μπορεί να ξεπερνά τους 200 χαρακτήρες") String> criteria
) {}
