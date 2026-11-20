package forum.dipromatiki.dtos;

import forum.dipromatiki.entity.TaskStatus;
import jakarta.validation.constraints.NotNull;

public record TaskStatusRequest(@NotNull(message = "Η κατάσταση είναι υποχρεωτική") TaskStatus status) {}
