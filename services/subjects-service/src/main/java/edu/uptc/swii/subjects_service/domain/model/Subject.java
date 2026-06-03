package edu.uptc.swii.subjects_service.domain.model;

import java.time.Instant;
import java.util.Objects;

public class Subject {
    private final String id;
    private final String name;
    private final String description;
    private final int semester;
    private final int careerId;
    private final Instant createdAt;
    private final Instant updatedAt;

    public Subject(
            String id,
            String name,
            String description,
            int semester,
            int careerId,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = id;
        this.name = normalizeName(name);
        this.description = normalizeDescription(description);
        this.semester = validateSemester(semester);
        this.careerId = validateCareerId(careerId);
        this.createdAt = Objects.requireNonNull(createdAt, "createdAt is required");
        this.updatedAt = Objects.requireNonNull(updatedAt, "updatedAt is required");
    }

    public static Subject create(String name, String description, int semester, int careerId) {
        Instant now = Instant.now();
        return new Subject(null, name, description, semester, careerId, now, now);
    }

    public Subject update(String newName, String newDescription, Integer newSemester) {
        String finalName = newName != null ? normalizeName(newName) : this.name;
        String finalDescription = newDescription != null ? normalizeDescription(newDescription) : this.description;
        int finalSemester = newSemester != null ? validateSemester(newSemester) : this.semester;
        return new Subject(this.id, finalName, finalDescription, finalSemester, this.careerId, this.createdAt, Instant.now());
    }

    private static String normalizeName(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Subject name is required");
        }
        String normalized = value.trim();
        if (normalized.length() < 3 || normalized.length() > 255) {
            throw new IllegalArgumentException("Subject name length must be between 3 and 255 characters");
        }
        return normalized;
    }

    private static String normalizeDescription(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim();
        if (normalized.length() > 1000) {
            throw new IllegalArgumentException("Description cannot exceed 1000 characters");
        }
        return normalized;
    }

    private static int validateSemester(int value) {
        if (value < 1 || value > 10) {
            throw new IllegalArgumentException("Semester must be between 1 and 10");
        }
        return value;
    }

    private static int validateCareerId(int value) {
        if (value <= 0) {
            throw new IllegalArgumentException("Career id must be greater than 0");
        }
        return value;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public int getSemester() {
        return semester;
    }

    public int getCareerId() {
        return careerId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
