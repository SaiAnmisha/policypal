package com.policypal.common;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

// Limits how often one IP address can call the expensive or sensitive endpoints.
// Counts are kept in memory, which is fine for a single server.
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private record Rule(String name, List<String> endpoints, int limit, Duration window) {
        boolean matches(HttpServletRequest request) {
            return endpoints.contains(request.getMethod() + " " + request.getRequestURI());
        }
    }

    // A counter and the time its window started
    private static final class Window {
        private final long startMillis;
        private final AtomicInteger count = new AtomicInteger();

        private Window(long startMillis) {
            this.startMillis = startMillis;
        }
    }

    private static final List<Rule> RULES = List.of(
            new Rule("login", List.of("POST /auth/login"), 10, Duration.ofMinutes(1)),
            new Rule("register", List.of("POST /auth/register"), 5, Duration.ofHours(1)),
            new Rule("demo", List.of("POST /auth/demo"), 5, Duration.ofHours(1)),
            new Rule("upload", List.of("POST /documents", "POST /documents/sample"), 20, Duration.ofHours(1)),
            new Rule("ask", List.of("POST /ask", "GET /ask/stream"), 20, Duration.ofMinutes(1)));

    private static final long LONGEST_WINDOW_MILLIS = Duration.ofHours(1).toMillis();
    private static final int MAX_TRACKED = 10_000;

    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        Rule rule = RULES.stream().filter(r -> r.matches(request)).findFirst().orElse(null);
        if (rule == null) {
            chain.doFilter(request, response);
            return;
        }

        long now = System.currentTimeMillis();
        long windowMillis = rule.window().toMillis();
        String key = rule.name() + ":" + request.getRemoteAddr();

        // Stop the map growing forever by dropping windows that have ended
        if (windows.size() > MAX_TRACKED) {
            windows.values().removeIf(w -> now - w.startMillis >= LONGEST_WINDOW_MILLIS);
        }

        // Start a fresh window if there isn't one or the old one has ended
        Window window = windows.compute(key, (k, current) ->
                current == null || now - current.startMillis >= windowMillis ? new Window(now) : current);

        if (window.count.incrementAndGet() > rule.limit()) {
            long retryAfterSeconds = Math.max(1, (window.startMillis + windowMillis - now + 999) / 1000);
            reject(response, retryAfterSeconds);
            return;
        }

        chain.doFilter(request, response);
    }

    private void reject(HttpServletResponse response, long retryAfterSeconds) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
        response.setContentType("application/problem+json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("""
                {"type":"about:blank","title":"Too Many Requests","status":429,"detail":"%s"}"""
                .formatted(waitMessage(retryAfterSeconds)));
    }

    private static String waitMessage(long seconds) {
        if (seconds < 60) {
            return "Too many requests. Please try again in " + seconds + " seconds.";
        }
        long minutes = (seconds + 59) / 60;
        return "Too many requests. Please try again in " + minutes + (minutes == 1 ? " minute." : " minutes.");
    }
}