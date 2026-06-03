package co.edu.uptc.swii.posts_service.application.usecase;

public record CreatePostCommand(
        String title,
        String description,
        String fileUrl,
        String textContent,
        Integer accessPoints,
        String topicId,
        String authenticatedUserId
) {
    public String topicId() {
        return topicId;
    }
}