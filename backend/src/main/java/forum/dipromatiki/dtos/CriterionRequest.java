package forum.dipromatiki.dtos;

import jakarta.validation.constraints.NotNull;

public record CriterionRequest(@NotNull(message = "Το πεδίο done είναι υποχρεωτικό") Boolean done) {}
