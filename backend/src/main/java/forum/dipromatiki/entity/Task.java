package forum.dipromatiki.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TaskTeam team;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TaskStatus status = TaskStatus.AVAILABLE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TaskPriority priority;

    private LocalDate dueDate;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private User createdBy;

    @ManyToMany
    @JoinTable(name = "task_assignees")
    private List<User> assignees = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "task_criteria")
    @OrderColumn
    private List<AcceptanceCriterion> criteria = new ArrayList<>();

    @OneToMany(mappedBy = "task", cascade = CascadeType.REMOVE)
    @OrderBy("createdAt ASC")
    private List<TaskComment> comments = new ArrayList<>();

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public Task() {}

    public Task(TaskTeam team, String title, String description, TaskPriority priority,
                LocalDate dueDate, User createdBy) {
        this.team = team;
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.dueDate = dueDate;
        this.createdBy = createdBy;
    }

    public Long getId() { return id; }
    public TaskTeam getTeam() { return team; }
    public void setTeam(TaskTeam team) { this.team = team; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public TaskStatus getStatus() { return status; }
    public void setStatus(TaskStatus status) { this.status = status; }
    public TaskPriority getPriority() { return priority; }
    public void setPriority(TaskPriority priority) { this.priority = priority; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public User getCreatedBy() { return createdBy; }
    public List<User> getAssignees() { return assignees; }
    public List<AcceptanceCriterion> getCriteria() { return criteria; }
    public List<TaskComment> getComments() { return comments; }
}
