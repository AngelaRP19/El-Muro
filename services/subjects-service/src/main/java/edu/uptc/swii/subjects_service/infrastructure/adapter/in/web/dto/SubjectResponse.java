package edu.uptc.swii.subjects_service.infrastructure.adapter.in.web.dto;

import java.time.Instant;

public record SubjectResponse(
        String id,
        String name,
        String description,
        int semester,
        int careerId,
        Instant createdAt,
        Instant updatedAt
) {
}
