package co.edu.uptc.swii.posts_service.application.port.in;

import co.edu.uptc.swii.posts_service.infrastructure.adapter.in.web.dto.PostResponse;

import java.util.List;

public interface ReadPostUseCase {
    PostResponse accessPost(Integer postId, String authenticatedUserId, String role);
    PostResponse viewPost(Integer postId, String authenticatedUserId);
    List<PostResponse> getLatestFeed(Integer limit, boolean includeHidden, String currentUserId);
    List<PostResponse> getPostsByTopicId(String topicId, boolean includeHidden, String currentUserId);
    List<PostResponse.CommentResponse> getComments(Integer postId);
}