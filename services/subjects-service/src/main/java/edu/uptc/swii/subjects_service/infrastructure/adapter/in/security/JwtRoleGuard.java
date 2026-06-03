package edu.uptc.swii.subjects_service.infrastructure.adapter.in.security;

import edu.uptc.swii.subjects_service.domain.exception.UnauthorizedOperationException;
import edu.uptc.swii.subjects_service.domain.model.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Component
public class JwtRoleGuard {

    private final SecretKey secretKey;

    public JwtRoleGuard(@Value("${security.jwt.secret}") String secret) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public void requireAdmin(String authorizationHeader, String xRoleHeader) {
        Role role = resolveRole(authorizationHeader, xRoleHeader);
        if (role != Role.ADMIN) {
            throw new UnauthorizedOperationException("Insufficient permissions. Requires admin role.");
        }
    }

    public void requireAuthenticated(String authorizationHeader, String xRoleHeader) {
        resolveRole(authorizationHeader, xRoleHeader);
    }

    private Role resolveRole(String authorizationHeader, String xRoleHeader) {
        if (xRoleHeader != null && !xRoleHeader.isBlank()) {
            try {
                return Role.fromTokenClaim(xRoleHeader);
            } catch (IllegalArgumentException ex) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, ex.getMessage());
            }
        }

        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authorization header missing. Use: Authorization: Bearer <token>");
        }

        String[] parts = authorizationHeader.split(" ");
        if (parts.length != 2 || !"bearer".equalsIgnoreCase(parts[0])) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid authorization header format. Use: Authorization: Bearer <token>");
        }

        try {
            Claims claims = Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(parts[1]).getPayload();
            return Role.fromTokenClaim((String) claims.get("rol"));
        } catch (JwtException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid token: " + ex.getMessage());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, ex.getMessage());
        }
    }
}
