package forum.dipromatiki.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "posts")
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 5000)
    private String content;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private User author;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Topic topic;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public Post() {}

    public Post(String content, User author, Topic topic) {
        this.content = content;
        this.author = author;
        this.topic = topic;
    }

    public Long getId() { return id; }
    public String getContent() { return content; }
    public User getAuthor() { return author; }
    public Topic getTopic() { return topic; }
    public Instant getCreatedAt() { return createdAt; }

    public void setContent(String content) { this.content = content; }
}
