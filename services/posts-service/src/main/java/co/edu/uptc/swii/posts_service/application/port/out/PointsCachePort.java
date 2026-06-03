package co.edu.uptc.swii.posts_service.application.port.out;

public interface PointsCachePort {
    int getUserPoints(String userId);
    void evictUserPoints(String userId);
}