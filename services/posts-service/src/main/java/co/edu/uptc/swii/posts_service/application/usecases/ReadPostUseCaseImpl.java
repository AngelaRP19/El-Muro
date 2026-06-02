package co.edu.uptc.swii.posts_service.application.usecases;

import co.edu.uptc.swii.posts_service.application.port.in.ReadPostUseCase;
import co.edu.uptc.swii.posts_service.application.service.PostService;
import co.edu.uptc.swii.posts_service.infrastructure.adapter.in.web.dto.PostResponse;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
public class ReadPostUseCaseImpl implements ReadPostUseCase {
    private final PostService postService;
    public ReadPostUseCaseImpl(PostService postService) { this.postService = postService; }
    @Override
    public PostResponse accessPost(Integer postId, String authenticatedUserId, String role) {
        return postService.accessPost(postId, authenticatedUserId, role);
    }
    @Override
    public PostResponse viewPost(Integer postId, String authenticatedUserId) {
        return postService.viewPost(postId, authenticatedUserId);
    }
    @Override
    public List<PostResponse> getLatestFeed(Integer limit, boolean includeHidden) {
        return postService.getLatestFeed(limit, includeHidden);
    }
    @Override
    public List<PostResponse> getPostsByTopicId(String topicId, boolean includeHidden) {
        return postService.getPostsByTopicId(topicId, includeHidden);
    }
}