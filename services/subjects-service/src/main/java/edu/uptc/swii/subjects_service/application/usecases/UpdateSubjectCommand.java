package edu.uptc.swii.subjects_service.application.usecases;

public record UpdateSubjectCommand(
        String name,
        String description,
        Integer semester
) {
}
