package com.policypal.document;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

import org.springframework.ai.document.Document;
import org.springframework.ai.reader.pdf.PagePdfDocumentReader;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.ai.vectorstore.filter.Filter;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;

@Service
public class DocumentService {

    private final VectorStore vectorStore;
    private final DocumentRepository documentRepository;

    public DocumentService(VectorStore vectorStore, DocumentRepository documentRepository) {
        this.vectorStore = vectorStore;
        this.documentRepository = documentRepository;
    }

    @Transactional
    public UploadResponse upload(MultipartFile file) throws IOException {
        String fileName = file.getOriginalFilename();

        if (file.isEmpty() || fileName == null || !fileName.toLowerCase().endsWith(".pdf")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please upload a PDF file");
        }

        byte[] bytes = file.getBytes();
        String contentHash = sha256(bytes);

        // Same content already uploaded, even under another name
        documentRepository.findByContentHash(contentHash).ifPresent(existing -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This PDF is already uploaded as " + existing.fileName());
        });

        // The PDF reader needs a Resource with a file name, so wrap the uploaded bytes
        Resource resource = new ByteArrayResource(bytes) {
            @Override
            public String getFilename() {
                return fileName;
            }
        };

        // One Document per page, each with its page number in the metadata
        List<Document> pages = new PagePdfDocumentReader(resource).read();

        // Split pages into smaller chunks. Each chunk keeps its page number
        List<Document> chunks = TokenTextSplitter.builder().build().apply(pages);

        if (chunks.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "No readable text found in this PDF. It may be a scanned image.");
        }

        UUID documentId = UUID.randomUUID();
        for (Document chunk : chunks) {
            chunk.getMetadata().put("document_id", documentId.toString());
            chunk.getMetadata().put("file_name", fileName);
        }

        // Creates an embedding for each chunk using Ollama, then saves it in pgvector
        vectorStore.add(chunks);

        documentRepository.save(documentId, fileName, contentHash, pages.size(), chunks.size());

        return new UploadResponse(documentId.toString(), fileName, pages.size(), chunks.size());
    }
    public List<DocumentRecord> list() {
        return documentRepository.findAll();
    }

    @Transactional
    public void delete(UUID id) {
        // Remove every chunk that belongs to this document
        Filter.Expression byDocument = new FilterExpressionBuilder()
                .eq("document_id", id.toString())
                .build();
        vectorStore.delete(byDocument);

        if (!documentRepository.deleteById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found");
        }
    }
    private static String sha256(byte[] bytes) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(bytes);
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }
}