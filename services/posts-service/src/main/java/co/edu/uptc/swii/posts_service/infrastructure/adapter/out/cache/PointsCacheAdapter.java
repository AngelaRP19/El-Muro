package co.edu.uptc.swii.posts_service.infrastructure.adapter.out.cache;

import co.edu.uptc.swii.posts_service.application.port.out.AuthMeshPort;
import co.edu.uptc.swii.posts_service.application.port.out.PointsCachePort;
import co.edu.uptc.swii.posts_service.infrastructure.config.CacheNames;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

@Component
public class PointsCacheAdapter implements PointsCachePort {

    private final AuthMeshPort authMeshPort;

    public PointsCacheAdapter(AuthMeshPort authMeshPort) {
        this.authMeshPort = authMeshPort;
    }

    @Override
    @Cacheable(cacheNames = CacheNames.USER_POINTS, key = "#userId")
    public int getUserPoints(String userId) {
        try {
            return authMeshPort.getUserPoints(userId);
        } catch (Exception e) {
            System.err.println("Error fetching user points from Auth Service: " + e.getMessage());
            return 10000;
        }
    }

    @Override
    @CacheEvict(cacheNames = CacheNames.USER_POINTS, key = "#userId")
    public void evictUserPoints(String userId) {
    }
}