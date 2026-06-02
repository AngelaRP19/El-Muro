package edu.uptc.swii.subjects_service.domain.exception;

public class CareerNotFoundException extends DomainException {
    public CareerNotFoundException(int careerId) {
        super("Career not found: " + careerId);
    }
}
