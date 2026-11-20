package forum.dipromatiki.dtos;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import java.util.List;

public record RoleRequest(
        @NotEmpty(message = "Πρέπει να επιλέξεις τουλάχιστον έναν ρόλο")
        List<@Pattern(
                regexp = "^(ADMIN|BOARD|COORDINATOR|PR_TEAM|DESIGN_TEAM|FR_TEAM|FULL_MEMBER|BABY_MEMBER|OBSERVER)$",
                message = "Μη έγκυρος ρόλος") String> roles
) {}
