package co.edu.uptc.swii.posts_service.domain.exception;

import org.springframework.http.HttpStatus;

public class PostNotFoundException extends DomainException {
    public PostNotFoundException() {
        super(HttpStatus.NOT_FOUND, "Post not found");
    }
}