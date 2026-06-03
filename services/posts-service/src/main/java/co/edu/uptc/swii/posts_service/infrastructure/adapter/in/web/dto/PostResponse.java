package co.edu.uptc.swii.posts_service.infrastructure.adapter.in.web.dto;

import java.util.List;

public record PostResponse(
        Integer id,
        String title,
        String description,
        String fileUrl,
        String textContent,
        Integer votes,
        Integer accessPoints,
        Boolean blocked,
        Boolean hidden,
        String createdAt,
        String authorId,
        String authorName,
        String topicId,
        List<CommentResponse> comments
) {
    public record CommentResponse(
            Integer id,
            String text,
            String authorId,
            String authorName,
            String createdAt
    ) {}
}