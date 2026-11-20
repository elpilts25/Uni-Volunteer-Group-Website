package forum.dipromatiki.entity;

import jakarta.persistence.*;
import java.time.Instant;

// When a user last opened a topic; anything posted after this is unread for them.
@Entity
@Table(name = "topic_reads", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "topic_id"}))
public class TopicRead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Topic topic;

    @Column(nullable = false)
    private Instant lastReadAt = Instant.now();

    public TopicRead() {}

    public TopicRead(User user, Topic topic) {
        this.user = user;
        this.topic = topic;
    }

    public void setLastReadAt(Instant lastReadAt) { this.lastReadAt = lastReadAt; }
}
