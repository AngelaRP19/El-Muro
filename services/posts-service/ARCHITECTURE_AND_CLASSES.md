# Posts Service - DDD + Hexagonal + Service Mesh

Este documento explica cada carpeta, paquete y clase del microservicio `posts-service`.

## 1. Estructura del servicio

- `k8s/`: manifiestos de Kubernetes + Istio para despliegue y service mesh.
- `src/`: codigo fuente principal y pruebas.
- `pom.xml`: dependencias y build del proyecto Spring Boot.

## 2. Capa Domain (`src/main/java/.../arch/domain`)

Contiene el nucleo del negocio, sin dependencias de framework.

### `domain/model/PostAggregate.java`
- Entidad de dominio principal para los posts (renombrada a `PostAggregate` para diferenciarla del document).
- Campos: `id`, `title`, `description`, `fileUrl`, `textContent`, `votes`, `accessPoints`, `blocked`, `hidden`, `createdAt`, `authorId`, `topicId`, `unlockedByUsers`, `votedByUsers`, `rewardedVotes`.
- Encapsula la logica de:
  - Posts bloqueados que requieren puntos de acceso.
  - Sistema de votacion con recompensa cada 3 votos.
  - Tracks que usuarios ya desbloquearon/votaron.

### `domain/model/PostRole.java`
- Enum de roles del dominio: `STUDENT`, `ADMIN`.
- Traduce claims de token (`admin`, `estudiante`, `student`) al enum interno.
- Metodos estaticos `isStudent(role)` e `isAdmin(role)`.

### `domain/exception/*.java`
- `DomainException`: base para errores de negocio con HttpStatus.
- `PostNotFoundException`: cuando no existe un post.
- `UnauthorizedPostOperationException`: cuando el rol no tiene permisos.
- `BusinessRuleViolationException`: cuando se violan reglas de negocio (e.g., votacion propia).

## 3. Capa Application (`src/main/java/.../arch/application`)

Coordina casos de uso y define puertos (interfaces).

### `application/port/in/CreatePostUseCase.java`
- Puerto de entrada para la operacion de creacion.
- Expone `createPost(CreatePostCommand command)`.

### `application/port/in/ReadPostUseCase.java`
- Puerto de entrada para operaciones de lectura.
- Expone:
  - `accessPost(postId, userId, role)` - desbloquea post si tiene puntos.
  - `viewPost(postId, userId)` - cobra 3 puntos por ver.
  - `getLatestFeed(limit, includeHidden)` - feed con cache.
  - `getPostsByTopicId(topicId, includeHidden)` - posts por tema.

### `application/port/in/UpdatePostUseCase.java`
- Puerto de entrada para actualizacion.
- Expone:
  - `updatePost(command)` - solo dueño, solo 10 min.
  - `toggleVisibility(postId, userId, role)` - solo admin.
  - `votePost(postId, userId)` - no votarse a si mismo, 3 votos = 1 punto.

### `application/port/in/DeletePostUseCase.java`
- Puerto de entrada para eliminacion.
- Expone `deletePost(postId, userId, role)` - admin o dueño.

### `application/port/out/PostRepositoryPort.java`
- Puerto de salida para persistencia.
- Abstraccion del repositorio de posts (Mongo u otro storage).
- Metodos: `findById`, `findTopByOrderByIdDesc`, `save`, `findAllByOrderByCreatedAtDesc`, `findByHiddenFalseOrderByCreatedAtDesc`, `findByTopicIdOrderByCreatedAtDesc`, `findByTopicIdAndHiddenFalseOrderByCreatedAtDesc`, `saveAll`, `deleteById`.

### `application/port/out/AuthMeshPort.java`
- Puerto de salida para comunicacion con auth-service.
- Expone: `getUserPoints`, `getUserName`, `deductPoints`, `addPoints`.

### `application/port/out/TopicValidationPort.java`
- Puerto de salida para validar si un topic existe en el servicio de temas.

### `application/port/out/PointsCachePort.java`
- Puerto de salida para cache de puntos de usuario.
- Expone: `getUserPoints` (cached), `evictUserPoints`.

### `application/usecase/CreatePostCommand.java`
- Record con: `title`, `description`, `fileUrl`, `textContent`, `accessPoints`, `topicId`, `authenticatedUserId`.

### `application/usecase/UpdatePostCommand.java`
- Record con: `postId`, `title`, `description`, `fileUrl`, `textContent`, `accessPoints`, `topicId`, `authenticatedUserId`.

### `application/service/PostService.java`
- Servicio de aplicacion que concentra toda la logica de negocio de posts.
- Usa puertos de salida: `PostRepositoryPort`, `AuthMeshPort`, `PointsCachePort`.
- Logica implementada:
  - **createPost**: crea post, genera ID secuencial, determina si bloqueado segun accessPoints.
  - **accessPost**: desbloquea post con puntos si tiene suficientes.
  - **viewPost**: cobra 3 puntos al autor (no a si mismo).
  - **updatePost**: solo dueño, solo 10 min desde creacion.
  - **toggleVisibility**: solo admin.
  - **votePost**: no votarse a si mismo, track voters, recompensa 1 punto cada 3 votos al autor.
  - **getLatestFeed**: feed cacheado con TTL.
  - **getPostsByTopicId**: filtra por topic.
  - **deletePost**: admin o dueño.

### `application/usecases/*UseCaseImpl.java`
- Implementaciones de puertos de entrada (`CreatePostUseCaseImpl`, `ReadPostUseCaseImpl`, `UpdatePostUseCaseImpl`, `DeletePostUseCaseImpl`).
- Delegan al `PostService` de aplicacion.

## 4. Capa Infrastructure (`src/main/java/.../arch/infrastructure`)

Implementa adapters concretos hacia HTTP, MongoDB, JWT y comunicacion entre servicios.

### 4.1 Adapter IN Web (`infrastructure/adapter/in/web`)

#### `PostController.java`
- API REST principal para posts.
- Endpoints:
  - `POST /api/posts` (estudiante/student) - crear post.
  - `GET /api/posts/{postId}` (estudiante/student/admin) - acceder/desbloquear post.
  - `POST /api/posts/{postId}/view` (estudiante/student) - ver post y cobrar puntos.
  - `GET /api/posts/feed/latest` (estudiante/student/admin) - feed con limite 1-100.
  - `GET /api/posts?temaId=...` (estudiante/student/admin) - posts por tema.
  - `PUT /api/posts/{postId}` (estudiante/student) - actualizar post.
  - `PATCH /api/posts/{postId}/visibility` (admin) - toggle visibilidad.
  - `POST /api/posts/{postId}/vote` (estudiante/student) - votar.
  - `DELETE /api/posts/{postId}` (estudiante/student/admin) - eliminar.

#### `HealthController.java`
- `GET /health` - healthcheck simple.

#### `dto/CreatePostRequest.java`, `UpdatePostRequest.java`, `PostResponse.java`
- DTOs de entrada y salida para la API REST.

#### `dto/PostMapper.java`
- Mapea entre DTOs web y comandos de aplicacion, y entre `PostAggregate` y `PostResponse`.

### 4.2 Adapter IN Security (`infrastructure/adapter/in/security`)

#### `AuthenticatedUser.java`
- Record con `userId` y `role` desde JWT.

#### `JwtService.java`
- Valida y parsea JWT con HmacSHA256.
- Extrae `userId` y `role` (soporta `role` y `rol` claims).

#### `JwtAuthenticationFilter.java`
- Filtro que autentica requests con `Authorization: Bearer ...`.

#### `SecurityConfig.java`
- Configuracion de Spring Security (stateless, JWT filter, permits `/health` y `/actuator/**`).

### 4.3 Adapter OUT Persistence Mongo (`infrastructure/adapter/out/persistence/mongo`)

#### `document/PostDocument.java`
- Documento Mongo para la coleccion `posts`.

#### `repository/PostMongoRepository.java`
- Repositorio Spring Data Mongo con metodos de busqueda personalizados.

#### `mapper/PostDocumentMapper.java`
- Mapea entre `PostDocument` y `PostAggregate`.

#### `PostMongoPersistenceAdapter.java`
- Implementacion de `PostRepositoryPort` usando MongoDB.

### 4.4 Adapter OUT Service Mesh (`infrastructure/adapter/out/servicemesh`)

#### `ServiceDiscoveryClient.java`
- Resuelve nombre de servicio a URL base (usa Eureka o DNS directo).

#### `HmacSigner.java`
- Firma HMAC-SHA256 para autenticacion de llamadas internas entre servicios.

#### `AuthMeshAdapter.java`
- Implementa `AuthMeshPort`.
- Llama a `auth-service` via `http://auth-service/...` con headers HMAC.
- `getUserPoints`: GET con firma.
- `getUserName`: GET con firma.
- `deductPoints`/`addPoints`: PATCH asincrono con firma.

#### `TopicMeshAdapter.java`
- Implementa `TopicValidationPort`.
- Verifica existencia de topic en `temas-service`.

#### `dto/InternalPointsResponse.java`, `InternalUserProfileResponse.java`, `AddPointsRequest.java`, `DeductPointsRequest.java`
- DTOs para comunicacion con auth-service.

### 4.5 Adapter OUT Cache (`infrastructure/adapter/out/cache`)

#### `PointsCacheAdapter.java`
- Implementa `PointsCachePort`.
- Usa `@Cacheable` para cachear puntos de usuario con TTL.
- Cachea 5 min por defecto.

### 4.6 Config (`infrastructure/config`)

#### `GlobalExceptionHandler.java`
- Manejo centralizado de `DomainException` -> respuestas HTTP.
- Traduce a codigos apropiados (401, 403, 404, 400).

#### `WebClientConfig.java`
- Bean `WebClient` con timeouts de 5s.

#### `RedisCacheConfig.java`
- Configuracion de `CacheManager` con Redis para cache de feed y puntos.

#### `CacheNames.java`
- Constantes: `FEED_LATEST`, `USER_POINTS`.

## 5. Bootstrap de la aplicacion

### `PostsServiceApplication.java`
- Clase principal de Spring Boot.
- Punto de arranque del microservicio.

## 6. Configuracion (`src/main/resources`)

### `application.yml`
- Config principal:
  - Nombre: `posts-service`
  - MongoDB: `MONGO_URI` (default localhost:27018)
  - Redis: `REDIS_HOST`, `REDIS_PORT`
  - Puerto: `PORT` (default 8002)
  - JWT secret: `JWT_SECRET`
  - HMAC secret: `HMAC_SECRET` (para firmas internas)
  - Integracion con auth-service y temas-service por nombre de servicio

## 7. Kubernetes + Istio (`k8s`)

### `deployment.yaml`
- Deployment de Kubernetes para `posts-service`.
- Puerto 8002, replicas 1.
- Variables de entorno: Mongo, Redis, JWT, nombres de servicios.

### `service.yaml`
- Service interno de Kubernetes.
- Expone `posts-service` en puerto 8002.

### `istio-destinationrule.yaml`
- DestinationRule de Istio.
- Configura `ISTIO_MUTUAL` para mTLS en mesh.

### `istio-virtualservice.yaml`
- VirtualService de Istio.
- Enruta trafico HTTP hacia `posts-service:8002`.

## 8. Tests (`src/test/java/.../arch`)

### `application/service/PostServiceTest.java`
- Tests unitarios del PostService de aplicacion.
- Valida:
  - Creacion de posts.
  - Acceso/desbloqueo con puntos.
  - Votacion con recompensa.
  - Excepciones: votacion propia, ya voto, puntos insuficientes.

## 9. Relacion con DDD + Hexagonal + Service Mesh

- **DDD**: reglas de negocio en `domain/model`, excepciones de dominio en `domain/exception`.
- **Hexagonal**:
  - Puertos de entrada: `CreatePostUseCase`, `ReadPostUseCase`, `UpdatePostUseCase`, `DeletePostUseCase`.
  - Puertos de salida: `PostRepositoryPort`, `AuthMeshPort`, `TopicValidationPort`, `PointsCachePort`.
  - Adapters in/out en `infrastructure/adapter`.
- **Service Mesh**:
  - Llamadas salientes usan nombre de servicio (`auth-service`, `temas-service`) sin IPs hardcodeadas.
  - Integracion por HMAC para autenticacion interna.
  - Istio `VirtualService` y `DestinationRule` para control de trafico.
  - mTLS automatico con `ISTIO_MUTUAL`.