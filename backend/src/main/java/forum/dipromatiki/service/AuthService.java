package forum.dipromatiki.service;

import forum.dipromatiki.dtos.AuthResponse;
import forum.dipromatiki.dtos.LoginRequest;
import forum.dipromatiki.dtos.RegisterRequest;
import forum.dipromatiki.entity.User;
import forum.dipromatiki.repositories.UserRepository;
import java.util.Locale;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       BCryptPasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    public AuthResponse register(RegisterRequest request) {
        String username = request.username().trim();
        String email = normalizeEmail(request.email());

        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Το όνομα χρήστη χρησιμοποιείται ήδη");
        }
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Το email χρησιμοποιείται ήδη");
        }

        User user = new User(
                username,
                request.fullName().trim(),
                email,
                request.department().trim(),
                request.phone().trim(),
                request.birthDate(),
                passwordEncoder.encode(request.password()),
                "OBSERVER"
        );
        userRepository.save(user);
        String token = jwtService.generateToken(user);
        return new AuthResponse(token, jwtService.getExpirationMs(), "ROLE_OBSERVER", "Registration successful");
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(normalizeEmail(request.email()))
                .orElseThrow(() -> new BadCredentialsException("Bad credentials"));
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getUsername(), request.password())
        );
        String token = jwtService.generateToken(user);
        String role = user.getRoles().stream().map(r -> "ROLE_" + r).collect(java.util.stream.Collectors.joining(","));
        return new AuthResponse(token, jwtService.getExpirationMs(), role, null);
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
