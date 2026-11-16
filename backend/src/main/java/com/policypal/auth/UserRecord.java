package com.policypal.auth;

import java.util.UUID;

public record UserRecord(UUID id, String email, String passwordHash) {
}