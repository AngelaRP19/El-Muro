package co.edu.uptc.swii.posts_service.application.usecases;

import co.edu.uptc.swii.posts_service.application.port.in.UpdatePostUseCase;
import co.edu.uptc.swii.posts_service.application.service.PostService;
import co.edu.uptc.swii.posts_service.application.usecase.UpdatePostCommand;
import co.edu.uptc.swii.posts_service.infrastructure.adapter.in.web.dto.PostResponse;
import org.springframework.stereotype.Component;

@Component
public class UpdatePostUseCaseImpl implements UpdatePostUseCase {
    private final PostService postService;
    public UpdatePostUseCaseImpl(PostService postService) { this.postService = postService; }
    @Override
    public PostResponse updatePost(UpdatePostCommand command) { return postService.updatePost(command); }
    @Override
    public PostResponse toggleVisibility(Integer postId, String authenticatedUserId, String role) {
        return postService.toggleVisibility(postId, authenticatedUserId, role);
    }
    @Override
    public PostResponse votePost(Integer postId, String authenticatedUserId) {
        return postService.votePost(postId, authenticatedUserId);
    }
    @Override
    public PostResponse.CommentResponse addComment(Integer postId, String text, String authenticatedUserId) {
        return postService.addComment(postId, text, authenticatedUserId);
    }
}