package co.edu.uptc.swii.posts_service.infrastructure.adapter.in.web.dto;

public record UpdatePostRequest(
        String title,
        String description,
        String fileUrl,
        String textContent,
        Integer accessPoints,
        String topicId
) {
}