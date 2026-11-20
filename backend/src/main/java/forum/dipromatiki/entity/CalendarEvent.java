package forum.dipromatiki.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "calendar_events")
public class CalendarEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private EventType type;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private LocalTime time;

    @Column(length = 200)
    private String location;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private User createdBy;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public CalendarEvent() {}

    public CalendarEvent(String title, EventType type, LocalDate date, LocalTime time,
                         String location, User createdBy) {
        this.title = title;
        this.type = type;
        this.date = date;
        this.time = time;
        this.location = location;
        this.createdBy = createdBy;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public EventType getType() { return type; }
    public LocalDate getDate() { return date; }
    public LocalTime getTime() { return time; }
    public String getLocation() { return location; }
    public User getCreatedBy() { return createdBy; }
}
