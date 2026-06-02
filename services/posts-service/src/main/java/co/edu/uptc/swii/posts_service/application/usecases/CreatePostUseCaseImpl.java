package co.edu.uptc.swii.posts_service.application.usecases;

import co.edu.uptc.swii.posts_service.application.port.in.CreatePostUseCase;
import co.edu.uptc.swii.posts_service.application.service.PostService;
import co.edu.uptc.swii.posts_service.application.usecase.CreatePostCommand;
import co.edu.uptc.swii.posts_service.infrastructure.adapter.in.web.dto.PostResponse;
import org.springframework.stereotype.Component;

@Component
public class CreatePostUseCaseImpl implements CreatePostUseCase {
    private final PostService postService;
    public CreatePostUseCaseImpl(PostService postService) { this.postService = postService; }
    @Override
    public PostResponse createPost(CreatePostCommand command) { return postService.createPost(command); }
}