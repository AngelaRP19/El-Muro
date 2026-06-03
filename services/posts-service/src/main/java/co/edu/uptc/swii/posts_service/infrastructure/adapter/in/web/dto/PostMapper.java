package co.edu.uptc.swii.posts_service.infrastructure.adapter.in.web.dto;

import co.edu.uptc.swii.posts_service.application.usecase.CreatePostCommand;
import co.edu.uptc.swii.posts_service.application.usecase.UpdatePostCommand;
import co.edu.uptc.swii.posts_service.domain.model.PostAggregate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

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
        return toResponse(post, authorName, null);
    }

    public PostResponse toResponse(PostAggregate post, String authorName, String currentUserId) {
        boolean isBlocked = Boolean.TRUE.equals(post.getBlocked())
                && !post.getAuthorId().equals(currentUserId)
                && (post.getUnlockedByUsers() == null || !post.getUnlockedByUsers().contains(currentUserId));
        
        String displayContent = isBlocked ? null : post.getTextContent();
        String displayDescription = isBlocked ? "Contenido protegido" : post.getDescription();
        String displayFileUrl = isBlocked ? null : post.getFileUrl();

        List<PostResponse.CommentResponse> commentResponses = null;
        if (post.getComments() != null && !post.getComments().isEmpty()) {
            commentResponses = post.getComments().stream()
                    .map(c -> new PostResponse.CommentResponse(
                            c.getId(),
                            c.getText(),
                            c.getAuthorId(),
                            c.getAuthorName(),
                            c.getCreatedAt().toString()
                    ))
                    .collect(Collectors.toList());
        }

        return new PostResponse(
                post.getId(),
                post.getTitle(),
                displayDescription,
                displayFileUrl,
                displayContent,
                post.getVotes(),
                post.getAccessPoints(),
                isBlocked,
                post.getHidden(),
                post.getCreatedAt().toString(),
                post.getAuthorId(),
                authorName,
                post.getTopicId(),
                commentResponses
        );
    }
}