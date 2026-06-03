package co.edu.uptc.swii.posts_service.application.port.in;

import co.edu.uptc.swii.posts_service.application.usecase.CreatePostCommand;
import co.edu.uptc.swii.posts_service.infrastructure.adapter.in.web.dto.PostResponse;

public interface CreatePostUseCase {
    PostResponse createPost(CreatePostCommand command);
}