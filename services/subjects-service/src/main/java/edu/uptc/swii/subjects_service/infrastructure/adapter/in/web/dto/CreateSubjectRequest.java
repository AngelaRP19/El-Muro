package edu.uptc.swii.subjects_service.infrastructure.adapter.in.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateSubjectRequest(
        @NotBlank
        @Size(min = 3, max = 255)
        String name,

        @Size(max = 1000)
        String description,

        @NotNull
        @Min(1)
        @Max(10)
        Integer semester,

        @NotNull
        @Min(1)
        Integer careerId
) {
}
