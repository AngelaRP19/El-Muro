package co.edu.uptc.swii.posts_service.domain.exception;

import org.springframework.http.HttpStatus;

public class BusinessRuleViolationException extends DomainException {
    public BusinessRuleViolationException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}