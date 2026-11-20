package forum.dipromatiki.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 60)
    private String name;

    @Column(length = 200)
    private String description;

    @Column(nullable = false, length = 20)
    private String icon = "chat";

    // Comma-separated Role names allowed to see the category; null means every member.
    @Column(length = 200)
    private String allowedRoles;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @OneToMany(mappedBy = "category", cascade = CascadeType.REMOVE)
    private List<Topic> topics = new ArrayList<>();

    public Category() {}

    public Category(String name, String description, String icon) {
        this.name = name;
        this.description = description;
        this.icon = icon;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    public Instant getCreatedAt() { return createdAt; }

    public List<String> getAllowedRoles() {
        if (allowedRoles == null || allowedRoles.isBlank()) return List.of();
        return Arrays.stream(allowedRoles.split(",")).map(String::trim).filter(r -> !r.isEmpty()).toList();
    }

    public void setAllowedRoles(Collection<String> roles) {
        String joined = roles == null ? "" : Arrays.stream(Role.values()).map(Role::name)
                .filter(roles::contains).collect(Collectors.joining(","));
        this.allowedRoles = joined.isEmpty() ? null : joined;
    }

    public boolean isVisibleTo(Collection<String> userRoles) {
        List<String> allowed = getAllowedRoles();
        return allowed.isEmpty() || allowed.stream().anyMatch(userRoles::contains);
    }
}
