package co.edu.uptc.swii.posts_service.infrastructure.adapter.in.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Map;

@Service
public class JwtService {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final SecretKey secretKey;

    public JwtService(@Value("${security.jwt.secret}") String jwtSecret) {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        this.secretKey = new SecretKeySpec(keyBytes, "HmacSHA256");
    }

    public AuthenticatedUser parseToken(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                throw new IllegalArgumentException("Invalid JWT format");
            }

            String signingInput = parts[0] + "." + parts[1];
            String expectedSignature = sign(signingInput);
            if (!MessageDigest.isEqual(
                    expectedSignature.getBytes(StandardCharsets.UTF_8),
                    parts[2].getBytes(StandardCharsets.UTF_8)
            )) {
                throw new IllegalArgumentException("Invalid JWT signature");
            }

            Map<String, Object> claims = objectMapper.readValue(
                    Base64.getUrlDecoder().decode(parts[1]),
                    MAP_TYPE
            );

            String userId = readStringClaim(claims.get("userId"));
            String role = readRole(claims);

            if (userId == null || userId.isBlank()) {
                throw new IllegalArgumentException("JWT without userId");
            }

            return new AuthenticatedUser(userId, role == null ? "" : role);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid JWT", e);
        }
    }

    private String sign(String signingInput) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(secretKey);
        byte[] signature = mac.doFinal(signingInput.getBytes(StandardCharsets.UTF_8));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(signature);
    }

    private String readRole(Map<String, Object> claims) {
        String role = readStringClaim(claims.get("role"));
        if (role == null || role.isBlank()) {
            role = readStringClaim(claims.get("rol"));
        }
        return role == null ? "" : role;
    }

    private String readStringClaim(Object value) {
        if (value instanceof String text && !text.isBlank()) {
            return text;
        }
        if (value != null) {
            return value.toString();
        }
        return null;
    }
}