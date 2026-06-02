package co.edu.uptc.swii.posts_service.infrastructure.adapter.in.web.dto;

import co.edu.uptc.swii.posts_service.application.usecase.CreatePostCommand;
import co.edu.uptc.swii.posts_service.application.usecase.UpdatePostCommand;
import co.edu.uptc.swii.posts_service.domain.model.PostAggregate;
import org.springframework.stereotype.Component;

@Component
public class PostMapper {

    public CreatePostCommand toCreateCommand(CreatePostRequest request, String authenticatedUserId) {
        return new CreatePostCommand(
                request.title(),
                request.description(),
                request.fileUrl(),
                request.textContent(),
                request.accessPoints(),
                request.topicId(),
                authenticatedUserId
        );
    }

    public UpdatePostCommand toUpdateCommand(Integer postId, UpdatePostRequest request, String authenticatedUserId) {
        return new UpdatePostCommand(
                postId,
                request.title(),
                request.description(),
                request.fileUrl(),
                request.textContent(),
                request.accessPoints(),
                request.topicId(),
                authenticatedUserId
        );
    }

    public PostResponse toResponse(PostAggregate post, String authorName) {
        return new PostResponse(
                post.getId(),
                post.getTitle(),
                post.getDescription(),
                post.getFileUrl(),
                post.getTextContent(),
                post.getVotes(),
                post.getAccessPoints(),
                post.getBlocked(),
                post.getHidden(),
                post.getCreatedAt().toString(),
                post.getAuthorId(),
                authorName,
                post.getTopicId()
        );
    }
}