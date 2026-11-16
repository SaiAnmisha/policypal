package com.policypal.auth;

import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class UserRepository {

    private final JdbcClient jdbc;

    public UserRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<UserRecord> findByEmail(String email) {
        return jdbc.sql("SELECT id, email, password_hash FROM users WHERE email = :email")
                .param("email", email)
                .query((rs, rowNum) -> new UserRecord(
                        rs.getObject("id", UUID.class),
                        rs.getString("email"),
                        rs.getString("password_hash")))
                .optional();
    }

    public boolean existsByEmail(String email) {
        return jdbc.sql("SELECT COUNT(*) FROM users WHERE email = :email")
                .param("email", email)
                .query(Long.class)
                .single() > 0;
    }

    public void save(UUID id, String email, String passwordHash) {
        jdbc.sql("INSERT INTO users (id, email, password_hash) VALUES (:id, :email, :passwordHash)")
                .param("id", id)
                .param("email", email)
                .param("passwordHash", passwordHash)
                .update();
    }
}