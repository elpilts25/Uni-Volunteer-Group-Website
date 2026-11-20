package forum.dipromatiki.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record RegisterRequest(
        @NotBlank(message = "Το όνομα χρήστη είναι υποχρεωτικό")
        @Size(min = 3, max = 50, message = "Το όνομα χρήστη πρέπει να έχει τουλάχιστον 3 χαρακτήρες")
        String username,

        @NotBlank(message = "Το ονοματεπώνυμο είναι υποχρεωτικό")
        String fullName,

        @NotBlank(message = "Το email είναι υποχρεωτικό")
        @Email(message = "Μη έγκυρο email")
        String email,

        @NotBlank(message = "Το τμήμα είναι υποχρεωτικό")
        String department,

        @NotBlank(message = "Το τηλέφωνο είναι υποχρεωτικό")
        @Pattern(regexp = "^[+0-9 ()-]{7,20}$", message = "Μη έγκυρο τηλέφωνο")
        String phone,

        @NotNull(message = "Η ημερομηνία γέννησης είναι υποχρεωτική")
        @Past(message = "Η ημερομηνία γέννησης πρέπει να είναι στο παρελθόν")
        LocalDate birthDate,

        @NotBlank(message = "Ο κωδικός είναι υποχρεωτικός")
        @Size(min = 6, message = "Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες")
        String password
) {}
