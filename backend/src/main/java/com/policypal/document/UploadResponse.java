package com.policypal.document;

public record UploadResponse(String documentId, String fileName, int pages, int chunks) {
    
}
