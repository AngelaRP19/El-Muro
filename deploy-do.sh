#!/bin/bash

set -e

echo "================================================="
echo " Deploying El Muro on Kubernetes (with Istio)   "
echo "================================================="

# Variables
ISTIO_VERSION="1.20.0"
DOCKER_REGISTRY="localhost:5001" # Or your DO registry

# 1. Install Istio if not present
if ! command -v istioctl &> /dev/null
then
    echo "istioctl could not be found. Please install Istio CLI."
    exit 1
fi

echo "-> Installing Istio..."
istioctl install --set profile=default -y
kubectl label namespace default istio-injection=enabled --overwrite

# 2. Install Telemetry Addons (Grafana, Prometheus, Kiali, Jaeger)
echo "-> Installing Istio Telemetry Addons (Grafana, Prometheus, Kiali, Jaeger)..."
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/addons/prometheus.yaml
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/addons/grafana.yaml
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/addons/jaeger.yaml
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/addons/kiali.yaml

# 3. Apply Databases
echo "-> Deploying databases..."
kubectl apply -f infrastructure/k8s/databases.yaml

# Wait for DBs
echo "-> Waiting for databases to be ready..."
sleep 10

# 4. Apply Services
echo "-> Deploying microservices..."

kubectl apply -f services/auth-service/k8s/
kubectl apply -f services/posts-service/k8s/
kubectl apply -f services/subjects-service/k8s/
kubectl apply -f services/topics-service/k8s/
kubectl apply -f services/career-service/k8s/
kubectl apply -f frontend/k8s/

# 5. Apply Global Gateway
echo "-> Applying Istio Global Gateway..."
kubectl apply -f infrastructure/istio/global-gateway.yaml

echo "================================================="
echo " Deployment triggered successfully!"
echo " Monitor rollout with: kubectl get pods -w"
echo " Access Grafana with: istioctl dashboard grafana"
echo " Access Kiali with: istioctl dashboard kiali"
echo "================================================="
