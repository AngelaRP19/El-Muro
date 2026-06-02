package edu.uptc.swii.subjects_service.domain.exception;

public class SubjectNotFoundException extends DomainException {
    public SubjectNotFoundException(String subjectId) {
        super("Subject not found: " + subjectId);
    }
}
