package co.edu.uptc.swii.posts_service.domain.model;

public enum PostRole {
    STUDENT("estudiante", "student"),
    ADMIN("admin");

    private final String firstRole;
    private final String secondRole;

    PostRole(String firstRole, String secondRole) {
        this.firstRole = firstRole;
        this.secondRole = secondRole;
    }

    PostRole(String firstRole) {
        this.firstRole = firstRole;
        this.secondRole = null;
    }

    public boolean matches(String role) {
        if (role == null) return false;
        return firstRole.equalsIgnoreCase(role) || (secondRole != null && secondRole.equalsIgnoreCase(role));
    }

    public static boolean isStudent(String role) {
        return STUDENT.matches(role);
    }

    public static boolean isAdmin(String role) {
        return ADMIN.matches(role);
    }
}