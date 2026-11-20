package forum.dipromatiki.service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

/**
 * Simple in-memory token blacklist. Replace with Redis/DB in production.
 */
@Service
public class TokenBlacklistService {

    private final Map<String, Long> blacklist = new ConcurrentHashMap<>();

    public void blacklist(String token, long expiresAtEpochMs) {
        blacklist.put(token, expiresAtEpochMs);
        purgeExpired();
    }

    public boolean isTokenBlacklisted(String token) {
        purgeExpired();
        return blacklist.containsKey(token);
    }

    private void purgeExpired() {
        long now = System.currentTimeMillis();
        blacklist.entrySet().removeIf(e -> e.getValue() < now);
    }
}

