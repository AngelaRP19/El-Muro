# Posts-Service: Class and Methods Documentation

This document explains the responsibility of each class and the behavior of its key methods in `posts-service`.

## 1) Entry Point

### `PostsServiceApplication`
Path: `src/main/java/co/edu/uptc/swii/posts_service/PostsServiceApplication.java`

#### Responsibility
- Bootstraps the Spring Boot application.

#### Methods
- `main(String[] args)`
  - Starts the Spring context and all configured beans.

---

## 2) Domain Model

### `Post`
Path: `src/main/java/co/edu/uptc/swii/posts_service/model/Post.java`

#### Responsibility
- Represents the post document persisted in MongoDB (`@Document(collection = "posts")`).
- Stores only references to external entities by ID (`authorId`, `topicId`) to keep loose coupling.

#### Fields
- `Integer id`: Unique post identifier.
- `String title`: Post title.
- `String description`: Post summary/description.
- `String fileUrl`: Optional file URL attached to the post.
- `String textContent`: Optional text content.
- `Integer votes`: Vote counter.
- `Integer accessPoints`: Required points to access protected content.
- `Boolean blocked`: Whether post content is considered protected.
- `LocalDateTime createdAt`: Creation timestamp.
- `Integer authorId`: User ID of the post creator.
- `Integer topicId`: Topic ID associated with the post.

#### Methods
- Standard getters and setters for each field.
- No domain logic is placed here (anemic entity style, logic is in service layer).

---

## 3) Repository Layer

### `RepositoryPost`
Path: `src/main/java/co/edu/uptc/swii/posts_service/repository/RepositoryPost.java`

#### Responsibility
- MongoDB data access for `Post` entities.

#### Methods
- Inherited CRUD methods from `MongoRepository<Post, Integer>`:
  - `save`, `findById`, `findAll`, `deleteById`, etc.
- `Optional<Post> findTopByOrderByIdDesc()`
  - Returns the post with the highest ID.
  - Used to generate the next integer ID for new posts.

---

## 4) DTOs

### `CreatePostRequest`
Path: `src/main/java/co/edu/uptc/swii/posts_service/dto/CreatePostRequest.java`

#### Responsibility
- Input payload for post creation.

#### Fields and Validation
- `title` (`@NotBlank`)
- `description` (`@NotBlank`)
- `fileUrl` (optional)
- `textContent` (optional)
- `accessPoints` (`@NotNull`, `@Min(0)`)
- `topicId` (`@NotNull`)

### `UpdatePostRequest`
Path: `src/main/java/co/edu/uptc/swii/posts_service/dto/UpdatePostRequest.java`

#### Responsibility
- Input payload for post update.

#### Fields and Validation
- Same structure and constraints as `CreatePostRequest`.

### `PostResponse`
Path: `src/main/java/co/edu/uptc/swii/posts_service/dto/PostResponse.java`

#### Responsibility
- Output payload returned by API endpoints.

#### Fields
- Includes full post information expected by API consumers.

---

## 5) Controller Layer

### `PostController`
Path: `src/main/java/co/edu/uptc/swii/posts_service/controller/PostController.java`

#### Responsibility
- Exposes REST endpoints for post operations.
- Enforces endpoint-level role checks before delegating to service layer.

#### Endpoints and Methods

- `createPost(CreatePostRequest request, AuthenticatedUser user)`
  - HTTP: `POST /api/posts`
  - Access: student only (`estudiante` or `student`).
  - Behavior:
    - Validates authenticated principal presence.
    - Validates role.
    - Delegates creation to `PostService.createPost`.

- `accessPost(Integer postId, AuthenticatedUser user)`
  - HTTP: `GET /api/posts/{postId}`
  - Access: admin or student.
  - Behavior:
    - Validates authenticated principal presence.
    - Validates role.
    - Delegates access flow to `PostService.accessPost`.

- `updatePost(Integer postId, UpdatePostRequest request, AuthenticatedUser user)`
  - HTTP: `PUT /api/posts/{postId}`
  - Access: student only.
  - Behavior:
    - Validates authenticated principal presence.
    - Validates role.
    - Delegates update flow to `PostService.updatePost`.

- `deletePost(Integer postId, AuthenticatedUser user)`
  - HTTP: `DELETE /api/posts/{postId}`
  - Access: admin or student.
  - Behavior:
    - Validates authenticated principal presence.
    - Validates role.
    - Delegates deletion flow to `PostService.deletePost`.

---

## 6) Service Layer

### `PostService`
Path: `src/main/java/co/edu/uptc/swii/posts_service/service/PostService.java`

#### Responsibility
- Implements business rules for post lifecycle and access control.
- Coordinates repository + external services (`TopicClient`, `AuthClient`).

#### Methods

- `PostResponse createPost(CreatePostRequest request, Integer authenticatedUserId)`
  - Validates authenticated user exists.
  - Validates topic existence with `TopicClient.existsById`.
  - Fetches user points from auth-service.
  - If `accessPoints > 0`, verifies sufficient points and deducts points.
  - Creates a new `Post` with generated ID and default values (`votes = 0`, `createdAt = now`).
  - Persists post and returns mapped response.

- `PostResponse accessPost(Integer postId, Integer authenticatedUserId)`
  - Validates authenticated user exists.
  - Loads post by ID; throws not found if absent.
  - If post is blocked and requester is not owner:
    - Queries current user points.
    - Rejects access if points are insufficient.
  - Returns mapped response.

- `PostResponse updatePost(Integer postId, UpdatePostRequest request, Integer authenticatedUserId)`
  - Validates authenticated user exists.
  - Loads post by ID.
  - Enforces ownership (only author can update).
  - Enforces time window: update allowed only within first 10 minutes from creation.
  - Validates topic existence.
  - Updates mutable fields and saves entity.
  - Returns mapped response.

- `void deletePost(Integer postId, Integer authenticatedUserId, String role)`
  - Validates authenticated user exists.
  - Loads post by ID.
  - Authorization:
    - admin can delete any post.
    - student can delete only own post.
  - Deletes post by ID.

- `Integer generatePostId()`
  - Uses `findTopByOrderByIdDesc()` to get latest ID and increments by 1.
  - Starts from `1` when there are no posts.

- `PostResponse mapToResponse(Post post)`
  - Maps entity fields to API response DTO.

---

## 7) Security

### `AuthenticatedUser`
Path: `src/main/java/co/edu/uptc/swii/posts_service/security/AuthenticatedUser.java`

#### Responsibility
- Carries authenticated principal data extracted from JWT.

#### Fields
- `Integer userId`
- `String role`

### `JwtService`
Path: `src/main/java/co/edu/uptc/swii/posts_service/security/JwtService.java`

#### Responsibility
- Parses and validates JWT using shared secret.

#### Methods
- `AuthenticatedUser parseToken(String token)`
  - Verifies JWT signature.
  - Extracts `userId` claim and converts to integer.
  - Extracts role with fallback (`role` first, then `rol`).
  - Returns `AuthenticatedUser`.

- `Integer readIntegerClaim(Object value)`
  - Converts claim values from `Number` or numeric `String` to `Integer`.

- `String readRole(Claims claims)`
  - Reads role claim, supporting two keys for compatibility.

### `JwtAuthenticationFilter`
Path: `src/main/java/co/edu/uptc/swii/posts_service/security/JwtAuthenticationFilter.java`

#### Responsibility
- Intercepts incoming requests and authenticates bearer tokens.

#### Methods
- `doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)`
  - Reads `Authorization: Bearer <token>`.
  - If token exists, parses and validates via `JwtService`.
  - On success, sets authentication in Spring Security context.
  - On failure, returns HTTP 401.

### `SecurityConfig`
Path: `src/main/java/co/edu/uptc/swii/posts_service/security/SecurityConfig.java`

#### Responsibility
- Defines stateless security behavior for the service.

#### Methods
- `SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter)`
  - Disables CSRF, basic auth, and form login.
  - Configures stateless sessions.
  - Sets unauthorized entry-point response.
  - Allows only health/actuator routes without authentication.
  - Requires authentication for all other routes.
  - Registers JWT filter before username/password filter.

---

## 8) External Integration Contracts

### `TopicClient`
Path: `src/main/java/co/edu/uptc/swii/posts_service/client/TopicClient.java`

#### Responsibility
- Abstraction for topic existence verification.

#### Methods
- `boolean existsById(Integer topicId)`

### `AuthClient`
Path: `src/main/java/co/edu/uptc/swii/posts_service/client/AuthClient.java`

#### Responsibility
- Abstraction for auth-service point operations.

#### Methods
- `int getUserPoints(Integer userId)`
- `void deductPoints(Integer userId, int points, String reason)`

---

## 9) External Integration Implementations

### `TopicWebClient`
Path: `src/main/java/co/edu/uptc/swii/posts_service/client/impl/TopicWebClient.java`

#### Responsibility
- Calls topic-service over HTTP using `WebClient`.

#### Methods
- `boolean existsById(Integer topicId)`
  - Performs GET to topic-service configured endpoint.
  - Returns `false` on 404.
  - Re-throws other HTTP errors.

### `AuthWebClient`
Path: `src/main/java/co/edu/uptc/swii/posts_service/client/impl/AuthWebClient.java`

#### Responsibility
- Calls auth-service internal endpoints protected with HMAC.

#### Methods
- `int getUserPoints(Integer userId)`
  - Builds HMAC headers (`x-service-id`, `x-service-timestamp`, `x-service-signature`).
  - Calls internal points endpoint.
  - Returns user points.

- `void deductPoints(Integer userId, int points, String reason)`
  - Builds signed PATCH request to internal deduct endpoint.
  - Sends deduction payload.
  - Handles error propagation strategy for expected/unknown failures.

---

## 10) Integration DTOs

### `InternalPointsRequest`
Path: `src/main/java/co/edu/uptc/swii/posts_service/client/dto/InternalPointsRequest.java`

#### Responsibility
- Payload for internal auth-service points query.

#### Fields
- `Integer userId`

### `InternalPointsResponse`
Path: `src/main/java/co/edu/uptc/swii/posts_service/client/dto/InternalPointsResponse.java`

#### Responsibility
- Response payload for internal auth-service points query.

#### Fields
- `Integer userId`
- `Integer points`

### `DeductPointsRequest`
Path: `src/main/java/co/edu/uptc/swii/posts_service/client/dto/DeductPointsRequest.java`

#### Responsibility
- Payload for internal point deduction request.

#### Fields
- `Integer points`
- `String reason`

---

## 11) Utility

### `HmacSigner`
Path: `src/main/java/co/edu/uptc/swii/posts_service/util/HmacSigner.java`

#### Responsibility
- Generates HMAC SHA-256 signatures for internal service calls.

#### Methods
- `String sign(String serviceId, String timestamp, String method, String path)`
  - Builds canonical payload: `serviceId:timestamp:METHOD:path`
  - Signs payload with `integration.internal.secret`.
  - Returns lowercase hex signature.

---

## 12) Exception Handling

### `ApiException`
Path: `src/main/java/co/edu/uptc/swii/posts_service/exception/ApiException.java`

#### Responsibility
- Represents controlled business/application exceptions with explicit HTTP status.

#### Methods
- Constructor `(HttpStatus status, String message)`
- `HttpStatus getStatus()`

### `GlobalExceptionHandler`
Path: `src/main/java/co/edu/uptc/swii/posts_service/exception/GlobalExceptionHandler.java`

#### Responsibility
- Centralized mapping of exceptions to HTTP responses.

#### Methods
- `handleApiException(ApiException exception)`
  - Returns status and message from custom exception.

- `handleValidation(MethodArgumentNotValidException exception)`
  - Returns 400 with first validation error summary.

- `handleWebClient(WebClientResponseException exception)`
  - Maps selected downstream statuses.
  - Falls back to 502 for unknown external errors.

- `handleAccessDenied(AccessDeniedException exception)`
  - Returns 403 when authorization is denied.

- `handleUnknown(Exception exception)`
  - Returns 500 for unexpected runtime errors.

- `build(HttpStatus status, String message)`
  - Internal helper to build response body.

---

## 13) Configuration

### `WebClientConfig`
Path: `src/main/java/co/edu/uptc/swii/posts_service/config/WebClientConfig.java`

#### Responsibility
- Declares `WebClient` bean used by integration clients.

#### Methods
- `WebClient webClient()`
  - Returns `WebClient.create()`.

### `application.yml`
Path: `src/main/resources/application.yml`

#### Responsibility
- Holds runtime configuration for:
  - service name and port
  - MongoDB URI
  - JWT secret
  - internal integration secrets/paths
  - auth-service and topic-service base URLs
  - Eureka registration URL

---

## 14) Build Dependencies

### `pom.xml`
Path: `pom.xml`

#### Responsibility
- Declares dependencies required for:
  - Spring MVC
  - Spring Security
  - WebClient (WebFlux)
  - Validation
  - JWT parsing (jjwt)
  - MongoDB
  - Eureka client
  - Testing stack
