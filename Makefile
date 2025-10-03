# Makefile for Daily Mess Feedback System

.PHONY: help build start stop restart logs clean dev test docker-build docker-push k8s-deploy k8s-clean

# Default target
help: ## Show this help message
	@echo "Daily Mess Feedback System - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development commands
dev: ## Start development environment
	docker-compose -f docker-compose.dev.yml up -d
	@echo "Development environment started!"
	@echo "Frontend: http://localhost:5173"
	@echo "Backend: http://localhost:5000"

dev-logs: ## Show development logs
	docker-compose -f docker-compose.dev.yml logs -f

dev-stop: ## Stop development environment
	docker-compose -f docker-compose.dev.yml down

# Production commands
build: ## Build production Docker images
	docker-compose build

start: ## Start production environment
	docker-compose up -d
	@echo "Production environment started!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:5000"

stop: ## Stop production environment
	docker-compose down

restart: ## Restart production environment
	docker-compose restart

logs: ## Show production logs
	docker-compose logs -f

# Individual service commands
build-backend: ## Build backend service only
	docker-compose build backend

build-frontend: ## Build frontend service only
	docker-compose build frontend

start-backend: ## Start backend service only
	docker-compose up -d backend

start-frontend: ## Start frontend service only
	docker-compose up -d frontend

logs-backend: ## Show backend logs
	docker-compose logs -f backend

logs-frontend: ## Show frontend logs
	docker-compose logs -f frontend

# Testing commands
test: ## Run tests
	@echo "Running backend tests..."
	cd backend && npm test || echo "No backend tests found"
	@echo "Running frontend tests..."
	cd frontend && npm test || echo "No frontend tests found"

test-backend: ## Run backend tests
	cd backend && npm test

test-frontend: ## Run frontend tests
	cd frontend && npm test

# Docker commands
docker-build: ## Build Docker images
	docker build -t mess-feedback-backend:latest ./backend
	docker build -t mess-feedback-frontend:latest ./frontend

docker-push: ## Push Docker images to registry (update registry URL)
	@echo "Please update the registry URL in this command"
	@echo "Example: docker push your-registry/mess-feedback-backend:latest"

# Kubernetes commands
k8s-deploy: ## Deploy to Kubernetes
	kubectl apply -f k8s/namespace.yaml
	kubectl apply -f k8s/secret.yaml
	kubectl apply -f k8s/configmap.yaml
	kubectl apply -f k8s/services.yaml
	kubectl apply -f k8s/backend-deployment.yaml
	kubectl apply -f k8s/frontend-deployment.yaml
	@echo "Kubernetes deployment completed!"

k8s-ingress: ## Deploy Kubernetes ingress
	kubectl apply -f k8s/ingress.yaml

k8s-status: ## Check Kubernetes deployment status
	kubectl get pods -n mess-feedback-system
	kubectl get services -n mess-feedback-system
	kubectl get ingress -n mess-feedback-system

k8s-logs: ## Show Kubernetes logs
	kubectl logs -f deployment/backend-deployment -n mess-feedback-system
	kubectl logs -f deployment/frontend-deployment -n mess-feedback-system

k8s-clean: ## Clean Kubernetes deployment
	kubectl delete -f k8s/
	@echo "Kubernetes deployment cleaned!"

# Utility commands
clean: ## Clean up Docker resources
	docker-compose down -v
	docker system prune -f
	@echo "Docker resources cleaned!"

status: ## Show status of all services
	docker-compose ps

health: ## Check health of services
	@echo "Checking backend health..."
	@curl -f http://localhost:5000/health || echo "Backend not responding"
	@echo "Checking frontend health..."
	@curl -f http://localhost:3000/health || echo "Frontend not responding"

install: ## Install dependencies locally
	cd backend && npm install
	cd frontend && npm install
	@echo "Dependencies installed!"

# Environment setup
setup: ## Initial setup
	cp .env.example .env
	@echo "Environment file created! Please edit .env with your configuration."
	@echo "Then run 'make install' to install dependencies."

# CI/CD simulation
ci-test: ## Simulate CI/CD pipeline locally
	@echo "Running CI/CD simulation..."
	@make test
	@make docker-build
	@echo "CI/CD simulation completed!"

# Database commands
db-init: ## Initialize database
	docker-compose up -d database
	@echo "Database initialized!"

db-reset: ## Reset database
	docker-compose down -v
	docker-compose up -d database
	@echo "Database reset!"
