package forum.dipromatiki.controller;

import forum.dipromatiki.dtos.AuthResponse;
import forum.dipromatiki.dtos.LoginRequest;
import forum.dipromatiki.dtos.RegisterRequest;
import forum.dipromatiki.service.AuthService;
import forum.dipromatiki.service.TokenBlacklistService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final TokenBlacklistService tokenBlacklistService;

    public AuthController(AuthService authService, TokenBlacklistService tokenBlacklistService) {
        this.authService = authService;
        this.tokenBlacklistService = tokenBlacklistService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            // Blacklist for max JWT lifetime (24h cap).
            tokenBlacklistService.blacklist(token, System.currentTimeMillis() + 24L * 3600L * 1000L);
        }
        return ResponseEntity.ok().build();
    }
}