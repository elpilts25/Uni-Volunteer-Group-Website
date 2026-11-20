package forum.dipromatiki.controller;

import forum.dipromatiki.dtos.CriterionRequest;
import forum.dipromatiki.dtos.TaskCommentRequest;
import forum.dipromatiki.dtos.TaskDetail;
import forum.dipromatiki.dtos.TaskRequest;
import forum.dipromatiki.dtos.TaskStatusRequest;
import forum.dipromatiki.dtos.TaskSummary;
import forum.dipromatiki.service.TaskService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public List<TaskSummary> list() {
        return taskService.list();
    }

    @GetMapping("/{id}")
    public TaskDetail get(@PathVariable Long id) {
        return taskService.get(id);
    }

    @PostMapping
    public ResponseEntity<TaskDetail> create(@Valid @RequestBody TaskRequest request, Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.create(request, principal.getName()));
    }

    @PutMapping("/{id}")
    public TaskDetail update(@PathVariable Long id, @Valid @RequestBody TaskRequest request) {
        return taskService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        taskService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    public TaskDetail setStatus(@PathVariable Long id, @Valid @RequestBody TaskStatusRequest request) {
        return taskService.setStatus(id, request.status());
    }

    @PostMapping("/{id}/claim")
    public TaskDetail claim(@PathVariable Long id, Principal principal) {
        return taskService.claim(id, principal.getName());
    }

    @DeleteMapping("/{id}/claim")
    public TaskDetail unclaim(@PathVariable Long id, Principal principal) {
        return taskService.unclaim(id, principal.getName());
    }

    @PatchMapping("/{id}/criteria/{index}")
    public TaskDetail setCriterion(@PathVariable Long id, @PathVariable int index,
                                   @Valid @RequestBody CriterionRequest request) {
        return taskService.setCriterion(id, index, request.done());
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<TaskDetail> addComment(@PathVariable Long id,
                                                 @Valid @RequestBody TaskCommentRequest request,
                                                 Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(taskService.addComment(id, request.content(), principal.getName()));
    }
}
