package forum.dipromatiki.dtos;

import forum.dipromatiki.entity.EventType;
import java.time.LocalDate;
import java.time.LocalTime;

public record EventResponse(
        Long id,
        String title,
        EventType type,
        LocalDate date,
        LocalTime time,
        String location,
        String createdBy
) {}
