package edu.uptc.swii.subjects_service.infrastructure.adapter.in.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record UpdateSubjectRequest(
        @Size(min = 3, max = 255)
        String name,

        @Size(max = 1000)
        String description,

        @Min(1)
        @Max(10)
        Integer semester
) {
}
