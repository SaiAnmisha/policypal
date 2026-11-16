package com.policypal.document;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.policypal.auth.CurrentUser;

@RestController
@RequestMapping("/documents")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UploadResponse upload(@RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal Jwt jwt) throws IOException {
        return documentService.upload(file, CurrentUser.id(jwt));
    }

    @GetMapping
    public List<DocumentRecord> list(@AuthenticationPrincipal Jwt jwt) {
        return documentService.list(CurrentUser.id(jwt));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        documentService.delete(id, CurrentUser.id(jwt));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/sample")
    public UploadResponse addSample(@AuthenticationPrincipal Jwt jwt) {
        return documentService.addSample(CurrentUser.id(jwt));
    }
}