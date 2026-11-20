package forum.dipromatiki.controller;

import java.security.Principal;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PingController {

    @GetMapping("/me")
    public Map<String, String> me(Principal principal) {
        return Map.of("username", principal.getName());
    }

    @GetMapping("/admin/ping")
    public Map<String, String> adminPing() {
        return Map.of("status", "admin-ok");
    }
}

