package co.edu.uptc.swii.posts_service.application.port.in;

import co.edu.uptc.swii.posts_service.application.usecase.UpdatePostCommand;
import co.edu.uptc.swii.posts_service.infrastructure.adapter.in.web.dto.PostResponse;

public interface UpdatePostUseCase {
    PostResponse updatePost(UpdatePostCommand command);
    PostResponse toggleVisibility(Integer postId, String authenticatedUserId, String role);
    PostResponse votePost(Integer postId, String authenticatedUserId);
}