package com.policypal.document;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class DocumentRepository {

    private final JdbcClient jdbc;

    public DocumentRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<DocumentRecord> findByContentHash(String contentHash) {
        return jdbc.sql("""
                SELECT id, file_name, pages, chunks, uploaded_at
                FROM documents
                WHERE content_hash = :contentHash
                """)
                .param("contentHash", contentHash)
                .query(this::toRecord)
                .optional();
    }

    public void save(UUID id, String fileName, String contentHash, int pages, int chunks) {
        jdbc.sql("""
                INSERT INTO documents (id, file_name, content_hash, pages, chunks)
                VALUES (:id, :fileName, :contentHash, :pages, :chunks)
                """)
                .param("id", id)
                .param("fileName", fileName)
                .param("contentHash", contentHash)
                .param("pages", pages)
                .param("chunks", chunks)
                .update();
    }

    public List<DocumentRecord> findAll() {
        return jdbc.sql("""
                SELECT id, file_name, pages, chunks, uploaded_at
                FROM documents
                ORDER BY uploaded_at DESC
                """)
                .query(this::toRecord)
                .list();
    }

    public boolean deleteById(UUID id) {
        return jdbc.sql("DELETE FROM documents WHERE id = :id")
                .param("id", id)
                .update() > 0;
    }

    private DocumentRecord toRecord(ResultSet rs, int rowNum) throws SQLException {
        return new DocumentRecord(
                rs.getObject("id", UUID.class),
                rs.getString("file_name"),
                rs.getInt("pages"),
                rs.getInt("chunks"),
                rs.getObject("uploaded_at", OffsetDateTime.class));
    }
}