package edu.uptc.swii.subjects_service.domain.exception;

public class UnauthorizedOperationException extends DomainException {
    public UnauthorizedOperationException(String message) {
        super(message);
    }
}
