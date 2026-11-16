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

    public Optional<DocumentRecord> findByOwnerAndContentHash(UUID ownerId, String contentHash) {
        return jdbc.sql("""
                SELECT id, file_name, pages, chunks, uploaded_at
                FROM documents
                WHERE owner_id = :ownerId AND content_hash = :contentHash
                """)
                .param("ownerId", ownerId)
                .param("contentHash", contentHash)
                .query(this::toRecord)
                .optional();
    }

    public void save(UUID id, UUID ownerId, String fileName, String contentHash, int pages, int chunks) {
        jdbc.sql("""
                INSERT INTO documents (id, owner_id, file_name, content_hash, pages, chunks)
                VALUES (:id, :ownerId, :fileName, :contentHash, :pages, :chunks)
                """)
                .param("id", id)
                .param("ownerId", ownerId)
                .param("fileName", fileName)
                .param("contentHash", contentHash)
                .param("pages", pages)
                .param("chunks", chunks)
                .update();
    }

    public List<DocumentRecord> findAllByOwner(UUID ownerId) {
        return jdbc.sql("""
                SELECT id, file_name, pages, chunks, uploaded_at
                FROM documents
                WHERE owner_id = :ownerId
                ORDER BY uploaded_at DESC
                """)
                .param("ownerId", ownerId)
                .query(this::toRecord)
                .list();
    }

    public boolean deleteByIdAndOwner(UUID id, UUID ownerId) {
        return jdbc.sql("DELETE FROM documents WHERE id = :id AND owner_id = :ownerId")
                .param("id", id)
                .param("ownerId", ownerId)
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