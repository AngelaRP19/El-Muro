package co.edu.uptc.swii.posts_service.application.port.out;

public interface TopicValidationPort {
    boolean existsById(String topicId);
}