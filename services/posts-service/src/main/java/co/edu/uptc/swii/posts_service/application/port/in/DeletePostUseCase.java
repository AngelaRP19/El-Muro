package co.edu.uptc.swii.posts_service.application.port.in;

public interface DeletePostUseCase {
    void deletePost(Integer postId, String authenticatedUserId, String role);
}