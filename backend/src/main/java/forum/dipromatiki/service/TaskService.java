package forum.dipromatiki.service;

import forum.dipromatiki.dtos.AssigneeResponse;
import forum.dipromatiki.dtos.CriterionResponse;
import forum.dipromatiki.dtos.TaskCommentResponse;
import forum.dipromatiki.dtos.TaskDetail;
import forum.dipromatiki.dtos.TaskRequest;
import forum.dipromatiki.dtos.TaskSummary;
import forum.dipromatiki.entity.AcceptanceCriterion;
import forum.dipromatiki.entity.Task;
import forum.dipromatiki.entity.TaskComment;
import forum.dipromatiki.entity.TaskStatus;
import forum.dipromatiki.entity.User;
import forum.dipromatiki.repositories.TaskCommentRepository;
import forum.dipromatiki.repositories.TaskRepository;
import forum.dipromatiki.repositories.UserRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class TaskService {

    private final TaskRepository tasks;
    private final TaskCommentRepository comments;
    private final UserRepository users;

    public TaskService(TaskRepository tasks, TaskCommentRepository comments, UserRepository users) {
        this.tasks = tasks;
        this.comments = comments;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<TaskSummary> list() {
        return tasks.findAllByOrderByIdAsc().stream().map(TaskService::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public TaskDetail get(Long id) {
        return toDetail(find(id));
    }

    public TaskDetail create(TaskRequest request, String username) {
        Task task = new Task(
                request.team(), request.title().trim(), clean(request.description()),
                request.priority(), request.dueDate(), findUser(username));
        applyCriteria(task, request, Map.of());
        return toDetail(tasks.save(task));
    }

    public TaskDetail update(Long id, TaskRequest request) {
        Task task = find(id);
        Map<String, Boolean> previous = new HashMap<>();
        task.getCriteria().forEach(c -> previous.put(c.getText(), c.isDone()));

        task.setTeam(request.team());
        task.setTitle(request.title().trim());
        task.setDescription(clean(request.description()));
        task.setPriority(request.priority());
        task.setDueDate(request.dueDate());
        applyCriteria(task, request, previous);
        return toDetail(task);
    }

    public void delete(Long id) {
        tasks.delete(find(id));
    }

    public TaskDetail setStatus(Long id, TaskStatus status) {
        Task task = find(id);
        task.setStatus(status);
        return toDetail(task);
    }

    public TaskDetail claim(Long id, String username) {
        Task task = find(id);
        User user = findUser(username);
        if (task.getAssignees().stream().noneMatch(a -> a.getId().equals(user.getId()))) {
            task.getAssignees().add(user);
        }
        if (task.getStatus() == TaskStatus.AVAILABLE) {
            task.setStatus(TaskStatus.DOING);
        }
        return toDetail(task);
    }

    public TaskDetail unclaim(Long id, String username) {
        Task task = find(id);
        task.getAssignees().removeIf(a -> a.getUsername().equals(username));
        if (task.getAssignees().isEmpty() && task.getStatus() == TaskStatus.DOING) {
            task.setStatus(TaskStatus.AVAILABLE);
        }
        return toDetail(task);
    }

    public TaskDetail setCriterion(Long id, int index, boolean done) {
        Task task = find(id);
        if (index < 0 || index >= task.getCriteria().size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Το κριτήριο δεν βρέθηκε");
        }
        task.getCriteria().get(index).setDone(done);
        return toDetail(task);
    }

    public TaskDetail addComment(Long id, String content, String username) {
        Task task = find(id);
        TaskComment comment = comments.save(new TaskComment(content.trim(), findUser(username), task));
        task.getComments().add(comment);
        return toDetail(task);
    }

    private static void applyCriteria(Task task, TaskRequest request, Map<String, Boolean> previous) {
        task.getCriteria().clear();
        if (request.criteria() == null) return;
        for (String text : request.criteria()) {
            String trimmed = text.trim();
            task.getCriteria().add(new AcceptanceCriterion(trimmed, previous.getOrDefault(trimmed, false)));
        }
    }

    private static TaskSummary toSummary(Task t) {
        return new TaskSummary(
                t.getId(), code(t), t.getTeam(), t.getTitle(), t.getStatus(), t.getPriority(), t.getDueDate(),
                t.getComments().size(), assignees(t),
                (int) t.getCriteria().stream().filter(AcceptanceCriterion::isDone).count(),
                t.getCriteria().size());
    }

    private static TaskDetail toDetail(Task t) {
        return new TaskDetail(
                t.getId(), code(t), t.getTeam(), t.getTitle(), t.getDescription(), t.getStatus(),
                t.getPriority(), t.getDueDate(), t.getCreatedBy().getFullName(), assignees(t),
                t.getCriteria().stream().map(c -> new CriterionResponse(c.getText(), c.isDone())).toList(),
                t.getComments().stream()
                        .map(c -> new TaskCommentResponse(
                                c.getId(), c.getAuthor().getFullName(), c.getContent(), c.getCreatedAt()))
                        .toList());
    }

    private static List<AssigneeResponse> assignees(Task t) {
        return t.getAssignees().stream()
                .map(u -> new AssigneeResponse(u.getUsername(), u.getFullName()))
                .toList();
    }

    private static String code(Task t) {
        return t.getTeam().name() + "-" + String.format("%04d", t.getId());
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private Task find(Long id) {
        return tasks.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Η εργασία δεν βρέθηκε"));
    }

    private User findUser(String username) {
        return users.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Μη έγκυρος χρήστης"));
    }
}
