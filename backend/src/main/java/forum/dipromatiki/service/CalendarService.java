package forum.dipromatiki.service;

import forum.dipromatiki.dtos.EventRequest;
import forum.dipromatiki.dtos.EventResponse;
import forum.dipromatiki.entity.CalendarEvent;
import forum.dipromatiki.repositories.CalendarEventRepository;
import forum.dipromatiki.repositories.UserRepository;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class CalendarService {

    // A month grid spans at most six weeks.
    private static final long MAX_RANGE_DAYS = 42;

    private final CalendarEventRepository events;
    private final UserRepository users;

    public CalendarService(CalendarEventRepository events, UserRepository users) {
        this.events = events;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<EventResponse> list(LocalDate from, LocalDate to) {
        if (to.isBefore(from) || ChronoUnit.DAYS.between(from, to) > MAX_RANGE_DAYS) {
            throw new IllegalArgumentException("Μη έγκυρο εύρος ημερομηνιών");
        }
        return events.findByDateBetweenOrderByDateAscTimeAsc(from, to).stream()
                .map(CalendarService::toResponse)
                .toList();
    }

    public EventResponse create(EventRequest request, String username) {
        var creator = users.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Μη έγκυρος χρήστης"));
        String location = request.location() == null || request.location().isBlank()
                ? null : request.location().trim();
        CalendarEvent event = new CalendarEvent(
                request.title().trim(), request.type(), request.date(), request.time(), location, creator);
        return toResponse(events.save(event));
    }

    public void delete(Long id, String username, boolean isAdmin) {
        CalendarEvent event = events.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Το γεγονός δεν βρέθηκε"));
        if (!isAdmin && !event.getCreatedBy().getUsername().equals(username)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Μπορείς να διαγράψεις μόνο δικά σου γεγονότα");
        }
        events.delete(event);
    }

    private static EventResponse toResponse(CalendarEvent e) {
        return new EventResponse(
                e.getId(), e.getTitle(), e.getType(), e.getDate(), e.getTime(),
                e.getLocation(), e.getCreatedBy().getUsername());
    }
}
