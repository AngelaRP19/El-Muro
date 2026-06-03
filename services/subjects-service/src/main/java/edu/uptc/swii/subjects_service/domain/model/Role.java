package edu.uptc.swii.subjects_service.domain.model;

public enum Role {
    ADMIN,
    STUDENT;

    public static Role fromTokenClaim(String rawRole) {
        if (rawRole == null || rawRole.isBlank()) {
            throw new IllegalArgumentException("Token missing role claim");
        }

        return switch (rawRole.trim().toLowerCase()) {
            case "admin" -> ADMIN;
            case "estudiante", "student" -> STUDENT;
            default -> throw new IllegalArgumentException("Invalid role in token: " + rawRole);
        };
    }
}
