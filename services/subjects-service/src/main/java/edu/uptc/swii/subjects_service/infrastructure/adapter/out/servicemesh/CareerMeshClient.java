package edu.uptc.swii.subjects_service.infrastructure.adapter.out.servicemesh;

import edu.uptc.swii.subjects_service.application.ports.out.CareerValidationPort;
import edu.uptc.swii.subjects_service.infrastructure.adapter.out.servicemesh.dto.CareerExistsResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class CareerMeshClient implements CareerValidationPort {

    private final RestClient restClient;
    private final String careersServiceName;
    private final String careersExistsPath;

    public CareerMeshClient(
            RestClient.Builder builder,
            @Value("${integration.careers.service-name:carreras-service}") String careersServiceName,
            @Value("${integration.careers.exists-path:/api/carreras/_exists/{careerId}}") String careersExistsPath
    ) {
        this.restClient = builder.build();
        this.careersServiceName = careersServiceName;
        this.careersExistsPath = careersExistsPath;
    }

    @Override
    public boolean careerExists(int careerId) {
        String meshUrl = "http://" + careersServiceName + careersExistsPath;
        try {
            ResponseEntity<CareerExistsResponse> response = restClient.get()
                    .uri(meshUrl, careerId)
                    .retrieve()
                    .toEntity(CareerExistsResponse.class);

            CareerExistsResponse body = response.getBody();
            return body != null && body.exists();
        } catch (RestClientException ex) {
            return false;
        }
    }
}
