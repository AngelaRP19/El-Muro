package co.edu.uptc.swii.posts_service.domain.exception;

import org.springframework.http.HttpStatus;

public class UnauthorizedPostOperationException extends DomainException {
    public UnauthorizedPostOperationException(String message) {
        super(HttpStatus.FORBIDDEN, message);
    }
}