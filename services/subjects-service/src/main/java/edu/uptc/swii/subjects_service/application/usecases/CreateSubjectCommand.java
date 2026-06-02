package edu.uptc.swii.subjects_service.application.usecases;

public record CreateSubjectCommand(
        String name,
        String description,
        int semester,
        int careerId
) {
}
