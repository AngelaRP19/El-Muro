package co.edu.uptc.swii.posts_service.infrastructure.adapter.in.web.dto;

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
        String topicId
) {
}