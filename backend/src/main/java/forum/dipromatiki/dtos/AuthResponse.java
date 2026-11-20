package forum.dipromatiki.dtos;

public record AuthResponse(String token, long expiresInMs, String role, String message) {
    public AuthResponse(String token, long expiresInMs, String role) {
        this(token, expiresInMs, role, null);
    }
}
