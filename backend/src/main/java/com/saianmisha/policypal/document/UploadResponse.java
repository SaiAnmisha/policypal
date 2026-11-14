package com.saianmisha.policypal.document;

public record UploadResponse(String documentId, String fileName, int pages, int chunks) {
    
}
