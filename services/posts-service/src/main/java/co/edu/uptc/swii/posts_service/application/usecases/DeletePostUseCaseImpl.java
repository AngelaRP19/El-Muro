package co.edu.uptc.swii.posts_service.application.usecases;

import co.edu.uptc.swii.posts_service.application.port.in.DeletePostUseCase;
import co.edu.uptc.swii.posts_service.application.service.PostService;
import org.springframework.stereotype.Component;

@Component
public class DeletePostUseCaseImpl implements DeletePostUseCase {
    private final PostService postService;
    public DeletePostUseCaseImpl(PostService postService) { this.postService = postService; }
    @Override
    public void deletePost(Integer postId, String authenticatedUserId, String role) {
        postService.deletePost(postId, authenticatedUserId, role);
    }
}