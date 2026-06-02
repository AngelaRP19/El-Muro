package co.edu.uptc.swii.posts_service.infrastructure.adapter.out.servicemesh;

import co.edu.uptc.swii.posts_service.application.port.out.TopicValidationPort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Component
public class TopicMeshAdapter implements TopicValidationPort {

    private final WebClient webClient;

    @Value("${integration.topic-service.base-url}")
    private String topicServiceBaseUrl;

    @Value("${integration.topic-service.exists-path}")
    private String topicExistsPath;

    public TopicMeshAdapter(WebClient webClient) {
        this.webClient = webClient;
    }

    @Override
    public boolean existsById(String topicId) {
        try {
            String completeUrl = topicServiceBaseUrl + topicExistsPath.replace("{topicId}", topicId);
            webClient.get()
                .uri(completeUrl)
                .retrieve()
                .toBodilessEntity()
                .block();
            return true;
        } catch (WebClientResponseException exception) {
            if (exception.getStatusCode() == HttpStatus.NOT_FOUND) {
                return false;
            }
            throw exception;
        }
    }
}