package com.policypal.auth;

import java.time.Instant;

public record TokenResponse(String token, String email, Instant expiresAt) {
}