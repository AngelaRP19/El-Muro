package co.edu.uptc.swii.posts_service.infrastructure.adapter.out.servicemesh;

import co.edu.uptc.swii.posts_service.application.port.out.AuthMeshPort;
import co.edu.uptc.swii.posts_service.infrastructure.adapter.out.servicemesh.dto.AddPointsRequest;
import co.edu.uptc.swii.posts_service.infrastructure.adapter.out.servicemesh.dto.DeductPointsRequest;
import co.edu.uptc.swii.posts_service.infrastructure.adapter.out.servicemesh.dto.InternalPointsResponse;
import co.edu.uptc.swii.posts_service.infrastructure.adapter.out.servicemesh.dto.InternalUserProfileResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Instant;

@Component
public class AuthMeshAdapter implements AuthMeshPort {

    private static final Logger logger = LoggerFactory.getLogger(AuthMeshAdapter.class);
    private final WebClient webClient;
    private final HmacSigner hmacSigner;

    @Value("${integration.auth-service.base-url}")
    private String authServiceBaseUrl;

    @Value("${integration.auth-service.points-api-path:/api/auth/internal/users/{userId}/points}")
    private String pointsApiPathTemplate;

    @Value("${integration.auth-service.points-sign-path:/internal/users/{userId}/points}")
    private String pointsSignPathTemplate;

    @Value("${integration.auth-service.deduct-points-api-path}")
    private String deductPointsApiPath;

    @Value("${integration.auth-service.deduct-points-sign-path}")
    private String deductPointsSignPath;

    @Value("${integration.auth-service.add-points-api-path}")
    private String addPointsApiPath;

    @Value("${integration.auth-service.add-points-sign-path}")
    private String addPointsSignPath;

    @Value("${integration.auth-service.profile-api-path:/api/auth/internal/users/{userId}/profile}")
    private String profileApiPathTemplate;

    @Value("${integration.auth-service.profile-sign-path:/internal/users/{userId}/profile}")
    private String profileSignPathTemplate;

    @Value("${integration.internal.service-id}")
    private String serviceId;

    public AuthMeshAdapter(WebClient webClient, HmacSigner hmacSigner) {
        this.webClient = webClient;
        this.hmacSigner = hmacSigner;
    }

    @Override
    public int getUserPoints(String userId) {
        String apiPath = pointsApiPathTemplate.replace("{userId}", userId);
        String signPath = pointsSignPathTemplate.replace("{userId}", userId);
        String timestamp = String.valueOf(Instant.now().toEpochMilli());
        String signature = hmacSigner.sign(serviceId, timestamp, HttpMethod.GET.name(), signPath);

        InternalPointsResponse response = webClient.get()
            .uri(authServiceBaseUrl + apiPath)
            .headers(headers -> {
                headers.add("x-service-id", serviceId);
                headers.add("x-service-timestamp", timestamp);
                headers.add("x-service-signature", signature);
            })
            .retrieve()
            .bodyToMono(InternalPointsResponse.class)
            .block();

        return response != null && response.points() != null ? response.points() : 0;
    }

    @Override
    public String getUserName(String userId) {
        if (userId == null || userId.isBlank()) return "Autor desconocido";
        try {
            String apiPath = profileApiPathTemplate.replace("{userId}", userId);
            String signPath = profileSignPathTemplate.replace("{userId}", userId);
            String timestamp = String.valueOf(Instant.now().toEpochMilli());
            String signature = hmacSigner.sign(serviceId, timestamp, HttpMethod.GET.name(), signPath);

            InternalUserProfileResponse response = webClient.get()
                .uri(authServiceBaseUrl + apiPath)
                .headers(headers -> {
                    headers.add("x-service-id", serviceId);
                    headers.add("x-service-timestamp", timestamp);
                    headers.add("x-service-signature", signature);
                })
                .retrieve()
                .bodyToMono(InternalUserProfileResponse.class)
                .block();

            return (response != null && response.nombre() != null && !response.nombre().isBlank())
                ? response.nombre() : "Autor desconocido";
        } catch (Exception exception) {
            logger.warn("Could not resolve author name for user {}: {}", userId, exception.getMessage());
            return "Autor desconocido";
        }
    }

    @Override
    public void deductPoints(String userId, int points, String reason) {
        if (userId == null || userId.isBlank()) return;
        String apiPath = deductPointsApiPath.replace("{userId}", userId);
        String signPath = deductPointsSignPath.replace("{userId}", userId);
        String timestamp = String.valueOf(Instant.now().toEpochMilli());
        String signature = hmacSigner.sign(serviceId, timestamp, HttpMethod.PATCH.name(), signPath);

        try {
            webClient.patch()
                .uri(authServiceBaseUrl + apiPath)
                .headers(headers -> {
                    headers.add("x-service-id", serviceId);
                    headers.add("x-service-timestamp", timestamp);
                    headers.add("x-service-signature", signature);
                })
                .bodyValue(new DeductPointsRequest(points, reason))
                .retrieve()
                .toBodilessEntity()
                .timeout(java.time.Duration.ofSeconds(2))
                .subscribe(
                    response -> logger.debug("Successfully deducted points for user {}", userId),
                    error -> logger.warn("Error calling Auth Service deductPoints for user {}: {}", userId, error.getMessage())
                );
        } catch (Exception exception) {
            logger.warn("Error initiating Auth Service deductPoints call for user {}: {}", userId, exception.getMessage());
        }
    }

    @Override
    public void addPoints(String userId, int points, String reason) {
        if (userId == null || userId.isBlank()) return;
        String apiPath = addPointsApiPath.replace("{userId}", userId);
        String signPath = addPointsSignPath.replace("{userId}", userId);
        String timestamp = String.valueOf(Instant.now().toEpochMilli());
        String signature = hmacSigner.sign(serviceId, timestamp, HttpMethod.PATCH.name(), signPath);

        try {
            webClient.patch()
                .uri(authServiceBaseUrl + apiPath)
                .headers(headers -> {
                    headers.add("x-service-id", serviceId);
                    headers.add("x-service-timestamp", timestamp);
                    headers.add("x-service-signature", signature);
                })
                .bodyValue(new AddPointsRequest(points, reason))
                .retrieve()
                .toBodilessEntity()
                .timeout(java.time.Duration.ofSeconds(2))
                .subscribe(
                    response -> logger.debug("Successfully added points for user {}", userId),
                    error -> logger.warn("Error calling Auth Service addPoints for user {}: {}", userId, error.getMessage())
                );
        } catch (Exception exception) {
            logger.warn("Error initiating Auth Service addPoints call for user {}: {}", userId, exception.getMessage());
        }
    }
}