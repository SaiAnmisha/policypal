package com.policypal.document;

import java.io.IOException;
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
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DocumentService {

    private final VectorStore vectorStore;

    public DocumentService(VectorStore vectorStore) {
        this.vectorStore = vectorStore;
    }

    public UploadResponse upload(MultipartFile file) throws IOException {
        String fileName = file.getOriginalFilename();

        if (file.isEmpty() || fileName == null || !fileName.toLowerCase().endsWith(".pdf")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please upload a PDF file");
        }

        // The PDF reader needs a Resource with a file name, so wrap the uploaded bytes
        Resource resource = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return fileName;
            }
        };

        // One Document per page, each with its page number in the metadata
        List<Document> pages = new PagePdfDocumentReader(resource).read();

        // Split pages into smaller chunks. Each chunk keeps its page number
        List<Document> chunks = TokenTextSplitter.builder().build().apply(pages);

        String documentId = UUID.randomUUID().toString();
        for (Document chunk : chunks) {
            chunk.getMetadata().put("document_id", documentId);
            chunk.getMetadata().put("file_name", fileName);
        }

        // Creates an embedding for each chunk using Ollama, then saves it in pgvector
        vectorStore.add(chunks);

        return new UploadResponse(documentId, fileName, pages.size(), chunks.size());
    }
}