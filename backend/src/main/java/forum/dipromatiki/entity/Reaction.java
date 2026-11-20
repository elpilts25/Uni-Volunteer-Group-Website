package forum.dipromatiki.entity;

import jakarta.persistence.*;
import java.time.Instant;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

// One emoji reaction by one user on either a topic or a post (exactly one of the two is set).
@Entity
@Table(name = "reactions", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "topic_id", "emoji"}),
        @UniqueConstraint(columnNames = {"user_id", "post_id", "emoji"})
})
public class Reaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Topic topic;

    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Post post;

    @Column(nullable = false, length = 16)
    private String emoji;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public Reaction() {}

    public Reaction(User user, Topic topic, Post post, String emoji) {
        this.user = user;
        this.topic = topic;
        this.post = post;
        this.emoji = emoji;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public Topic getTopic() { return topic; }
    public Post getPost() { return post; }
    public String getEmoji() { return emoji; }
    public Instant getCreatedAt() { return createdAt; }
}
