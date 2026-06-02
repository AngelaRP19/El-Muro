package co.edu.uptc.swii.posts_service.application.port.out;

public interface AuthMeshPort {
    int getUserPoints(String userId);
    String getUserName(String userId);
    void deductPoints(String userId, int points, String reason);
    void addPoints(String userId, int points, String reason);
}