package com.policypal.document;

import java.time.OffsetDateTime;
import java.util.UUID;

public record DocumentRecord(UUID id, String fileName, int pages, int chunks, OffsetDateTime uploadedAt) {
}