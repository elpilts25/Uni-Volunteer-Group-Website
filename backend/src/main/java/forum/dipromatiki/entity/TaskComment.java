package forum.dipromatiki.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "task_comments")
public class TaskComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 2000)
    private String content;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private User author;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Task task;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public TaskComment() {}

    public TaskComment(String content, User author, Task task) {
        this.content = content;
        this.author = author;
        this.task = task;
    }

    public Long getId() { return id; }
    public String getContent() { return content; }
    public User getAuthor() { return author; }
    public Task getTask() { return task; }
    public Instant getCreatedAt() { return createdAt; }
}
