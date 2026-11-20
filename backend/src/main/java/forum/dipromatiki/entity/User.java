package forum.dipromatiki.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

@Entity
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String fullName;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String department;

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false)
    private LocalDate birthDate;

    @Column(nullable = false)
    private String password;

    // Comma-separated Role names, e.g. "BOARD,PR_TEAM"; kept in the original column.
    @Column(nullable = false)
    private String role = Role.OBSERVER.name();

    // Nullable: rows created before this column existed have no sign-up date.
    private Instant createdAt = Instant.now();

    public User() {}

    public User(String username, String fullName, String email, String department,
                String phone, LocalDate birthDate, String password, String role) {
        this.username = username;
        this.fullName = fullName;
        this.email = email;
        this.department = department;
        this.phone = phone;
        this.birthDate = birthDate;
        this.password = password;
        this.role = role;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public void setUsername(String username) { this.username = username; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public LocalDate getBirthDate() { return birthDate; }
    public void setBirthDate(LocalDate birthDate) { this.birthDate = birthDate; }
    public void setPassword(String password) { this.password = password; }
    public List<String> getRoles() {
        return Arrays.stream(role.split(",")).map(String::trim).filter(r -> !r.isEmpty()).toList();
    }

    public void setRoles(Collection<String> roles) {
        this.role = Arrays.stream(Role.values()).map(Role::name).filter(roles::contains)
                .collect(Collectors.joining(","));
    }
    public Instant getCreatedAt() { return createdAt; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return getRoles().stream().map(r -> new SimpleGrantedAuthority("ROLE_" + r)).toList();
    }

    @Override public String getPassword() { return password; }
    @Override public String getUsername() { return username; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}

