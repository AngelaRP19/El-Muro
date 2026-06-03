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
    private final HmacSigner hmacSigner;
    private final String careersServiceName;
    private final String careersExistsPath;
    private final String careersExistsSignPath;
    private final String serviceId;

    public CareerMeshClient(
            RestClient.Builder builder,
            HmacSigner hmacSigner,
            @Value("${integration.careers.service-name:carreras-service}") String careersServiceName,
            @Value("${integration.careers.exists-path:/api/carreras/internal/{careerId}/exists}") String careersExistsPath,
            @Value("${integration.careers.exists-sign-path:/internal/{careerId}/exists}") String careersExistsSignPath,
            @Value("${integration.internal.service-id:subjects-service}") String serviceId
    ) {
        this.restClient = builder.build();
        this.hmacSigner = hmacSigner;
        this.careersServiceName = careersServiceName;
        this.careersExistsPath = careersExistsPath;
        this.careersExistsSignPath = careersExistsSignPath;
        this.serviceId = serviceId;
    }

    @Override
    public boolean careerExists(int careerId) {
        String meshUrl = "http://" + careersServiceName + careersExistsPath;
        String signPath = careersExistsSignPath.replace("{careerId}", String.valueOf(careerId));
        String timestamp = String.valueOf(java.time.Instant.now().toEpochMilli());
        String signature = hmacSigner.sign(serviceId, timestamp, org.springframework.http.HttpMethod.GET.name(), signPath);

        try {
            ResponseEntity<CareerExistsResponse> response = restClient.get()
                    .uri(meshUrl, careerId)
                    .header("x-service-id", serviceId)
                    .header("x-service-timestamp", timestamp)
                    .header("x-service-signature", signature)
                    .retrieve()
                    .toEntity(CareerExistsResponse.class);

            CareerExistsResponse body = response.getBody();
            return body != null && body.exists();
        } catch (RestClientException ex) {
            return false;
        }
    }
}
