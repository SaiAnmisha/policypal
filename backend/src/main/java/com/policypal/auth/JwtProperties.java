package com.policypal.auth;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "policypal.jwt")
public record JwtProperties(String secret, Duration expiry) {
}