package co.edu.uptc.swii.posts_service.infrastructure.adapter.out.servicemesh;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Component
public class HmacSigner {

    @Value("${security.hmac.secret}")
    private String hmacSecret;

    public String sign(String serviceId, String timestamp, String method, String path) {
        try {
            String message = serviceId + ":" + timestamp + ":" + method + ":" + path;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(hmacSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] signature = mac.doFinal(message.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().withoutPadding().encodeToString(signature);
        } catch (Exception e) {
            throw new RuntimeException("Failed to sign request", e);
        }
    }
}