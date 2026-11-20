package forum.dipromatiki.repositories;

import forum.dipromatiki.entity.CalendarEvent;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {
    List<CalendarEvent> findByDateBetweenOrderByDateAscTimeAsc(LocalDate from, LocalDate to);
}
