# Guia de pruebas individuales e Istio - posts-service

Esta guia te permite validar `posts-service` de forma aislada y luego comprobar que la configuracion de Service Mesh (Istio) funciona correctamente.

El servicio sigue arquitectura DDD + Hexagonal + Service Mesh con la estructura en paquete `arch/`.

## 1) Prueba individual (local, sin Kubernetes)

### 1.1 Prerrequisitos
- Java 17
- Maven
- Docker (para MongoDB y Redis)
- Variables de entorno definidas (o `.env`) para `MONGO_URI`, `REDIS_HOST`, `REDIS_PORT`, `JWT_SECRET`, `HMAC_SECRET`, etc.

### 1.2 Levantar dependencias locales
Desde `services/posts-service`:

```bash
docker compose up -d
```

### 1.3 Ejecutar pruebas automaticas
Desde `services/posts-service`:

```bash
mvn test
```

Esperado: todos los tests en verde (8 tests en `arch/application/service/PostServiceTest.java`).

### 1.4 Levantar el microservicio

```bash
mvn spring-boot:run
```

### 1.5 Smoke test

```bash
curl -i http://localhost:8002/health
```

Esperado: HTTP `200` y JSON con estado saludable.

### 1.6 Pruebas funcionales basicas

1. Obtener un JWT valido (desde `auth-service`).
2. Probar endpoints de posts con `Authorization: Bearer <token>`:
   - `POST /api/posts`
   - `GET /api/posts/{postId}`
   - `PUT /api/posts/{postId}`
   - `POST /api/posts/{postId}/vote`
   - `GET /api/posts/feed/latest?limit=20`
3. Verificar reglas clave del negocio:
   - Solo estudiante/student crea/actualiza/vota.
   - Admin puede cambiar visibilidad.
   - No se puede votar post propio.
   - Restriccion de 10 minutos para actualizar.
   - Puntos de acceso para posts bloqueados.
   - 3 puntos cobrados por ver post.

## 2) Prueba de integracion de comunicaciones

Para validar comunicacion con otros servicios (`auth-service`, `temas-service`):

1. Levantar esos microservicios.
2. Ejecutar flujo completo:
   - crear post en un `topicId` existente,
   - acceder/desbloquear post con puntos,
   - votar y confirmar recompensa de puntos al autor.
3. Revisar logs de `posts-service` y de servicios externos para verificar llamadas internas con firma HMAC.

## 3) Validacion con Kubernetes + Istio

## 3.1 Prerrequisitos
- Cluster Kubernetes activo
- Istio instalado
- `kubectl` e `istioctl`

### 3.2 Habilitar sidecar injection

```bash
kubectl create namespace el-muro
kubectl label namespace el-muro istio-injection=enabled --overwrite
```

### 3.3 Desplegar recursos del servicio
Desde `services/posts-service`:

```bash
kubectl apply -n el-muro -f k8s/
```

### 3.4 Verificar sidecar y estado de pods

```bash
kubectl get pods -n el-muro -l app=posts-service
kubectl get pod -n el-muro <pod-name> -o jsonpath='{.spec.containers[*].name}'
```

Esperado: contenedores `posts-service` + `istio-proxy`.

### 3.5 Verificar objetos Istio

```bash
kubectl get virtualservice,destinationrule -n el-muro
```

### 3.6 Verificar enrutamiento malla

```bash
istioctl proxy-status -n el-muro
istioctl proxy-config clusters -n el-muro <pod-name>
```

### 3.7 Smoke test dentro del cluster

```bash
kubectl run curl-test -n el-muro --rm -it --image=curlimages/curl -- \
  curl -i http://posts-service:8002/health
```

Esperado: HTTP `200`.

### 3.8 Observabilidad (opcional pero recomendado)

```bash
istioctl dashboard kiali
istioctl dashboard jaeger
```

Verifica:
- trafico entre `posts-service` y otros microservicios (`auth-service`, `temas-service`),
- latencia/errores,
- trazas distribuidas.

## 4) Arquitectura del codigo (arch/)

El codigo vive en `src/main/java/co/edu/uptc/swii/posts_service/arch/`:
- `domain/model/` - entidades y enums (PostAggregate, PostRole)
- `domain/exception/` - excepciones de negocio
- `application/port/in/` - puertos de entrada (UseCases)
- `application/port/out/` - puertos de salida (interfaces de adapters)
- `application/usecase/` - comandos (records)
- `application/service/` - logica de negocio (PostService)
- `application/usecases/` - implementaciones de UseCases
- `infrastructure/adapter/in/web/` - Controller, DTOs, Mapper
- `infrastructure/adapter/in/security/` - JWT, Security
- `infrastructure/adapter/out/persistence/mongo/` - MongoDB adapter
- `infrastructure/adapter/out/servicemesh/` - Auth y Topic adapters
- `infrastructure/adapter/out/cache/` - Redis cache adapter
- `infrastructure/config/` - configs globales

## 5) Checklist rapido de "todo correcto"

- `mvn test` pasa localmente (8 tests verdes).
- `/health` responde `200`.
- CRUD/flujo de posts funciona con JWT real.
- En K8s, pod con sidecar `istio-proxy`.
- `VirtualService` y `DestinationRule` aplicados.
- Llamadas internas visibles en Kiali.
