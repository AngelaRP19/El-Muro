# Pruebas de Career Service con Istio

Estas pruebas son las que sirven como evidencia para el taller de Service Mesh. Las pruebas con `pytest` validan el codigo, pero estas validan Kubernetes, Istio, sidecar, enrutamiento y gateway.

## 1. Construir imagen y cargarla en Kind

```bash
docker build -t career-service:latest .
kind load docker-image career-service:latest
```

## 2. Instalar Istio y habilitar inyeccion

```bash
istioctl install --set profile=demo -y
kubectl label namespace default istio-injection=enabled --overwrite
```

## 3. Desplegar el servicio

```bash
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/destination-rule.yaml
kubectl apply -f k8s/virtual-service.yaml
kubectl apply -f k8s/gateway.yaml
kubectl apply -f k8s/gateway-virtual-service.yaml
```

## 4. Verificar que el pod tenga sidecar de Istio

```bash
kubectl get pods
kubectl get pod -l app=career-service -o jsonpath="{.items[0].spec.containers[*].name}"
```

El resultado debe incluir:

```text
career-service istio-proxy
```

## 5. Verificar recursos de Service Mesh

```bash
kubectl get gateway
kubectl get virtualservice
kubectl get destinationrule
```

Debe aparecer:

```text
career-service-gateway
career-service
career-service-gateway-route
career-service
```

## 6. Probar acceso interno por Service de Kubernetes

```bash
kubectl run curl-test --rm -it --image=curlimages/curl --restart=Never -- \
  curl http://career-service:8001/health
```

Respuesta esperada:

```json
{"service":"career-service","status":"healthy"}
```

## 7. Probar acceso por Istio Gateway

```bash
kubectl port-forward -n istio-system svc/istio-ingressgateway 8080:80
```

En otra terminal:

```bash
curl http://127.0.0.1:8080/health
```

Crear carrera:

```bash
curl -X POST http://127.0.0.1:8080/api/carreras/crear \
  -H "Content-Type: application/json" \
  -H "x-role: ADMIN" \
  -d "{\"nombre\":\"Ingenieria de Sistemas\",\"descripcion\":\"Carrera de prueba\"}"
```

Listar carreras:

```bash
curl http://127.0.0.1:8080/api/carreras/ \
  -H "x-role: ESTUDIANTE"
```

## 8. Evidencias para entregar

Capturas recomendadas:

- `kubectl get pods`, mostrando el pod de `career-service`.
- `kubectl get pod -l app=career-service -o jsonpath="{.items[0].spec.containers[*].name}"`, mostrando `istio-proxy`.
- `kubectl get virtualservice,destinationrule,gateway`.
- Respuesta de `/health` por `http://127.0.0.1:8080/health`.
- Respuesta de crear/listar carrera por el gateway.

