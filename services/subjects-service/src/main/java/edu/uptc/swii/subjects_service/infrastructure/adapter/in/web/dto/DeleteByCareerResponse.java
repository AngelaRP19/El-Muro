package edu.uptc.swii.subjects_service.infrastructure.adapter.in.web.dto;

public record DeleteByCareerResponse(
        String message,
        int deletedCount
) {
}
