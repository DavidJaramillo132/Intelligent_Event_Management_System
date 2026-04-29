.PHONY: help dev prod logs clean build up down restart health

# Default environment
COMPOSE_DEV = docker-compose -f docker-compose.yml -f docker-compose.dev.yml
COMPOSE_PROD = docker-compose -f docker-compose.yml -f docker-compose.prod.yml

help: ## Show this help message
	@echo "Intelligent Event Management System - Docker Commands"
	@echo "======================================================"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

# Development targets
dev-up: ## Start development environment
	cd docker && $(COMPOSE_DEV) up -d

dev-down: ## Stop development environment
	cd docker && $(COMPOSE_DEV) down

dev-restart: ## Restart development services
	cd docker && $(COMPOSE_DEV) restart

dev-logs: ## View development logs (follow)
	cd docker && $(COMPOSE_DEV) logs -f

dev-clean: ## Remove development containers and volumes
	cd docker && $(COMPOSE_DEV) down -v

dev-build: ## Rebuild development images
	cd docker && $(COMPOSE_DEV) build

# Production targets
prod-up: ## Start production environment (requires .env setup)
	cd docker && $(COMPOSE_PROD) up -d

prod-down: ## Stop production environment
	cd docker && $(COMPOSE_PROD) down

prod-restart: ## Restart production services
	cd docker && $(COMPOSE_PROD) restart

prod-logs: ## View production logs (follow)
	cd docker && $(COMPOSE_PROD) logs -f

prod-build: ## Rebuild production images
	cd docker && $(COMPOSE_PROD) build --no-cache

# Common targets
ps: ## Show running containers
	cd docker && docker-compose ps

health: ## Check service health status
	@echo "Checking service health..."
	@cd docker && docker-compose exec -T postgres pg_isready -U eventos_user || true
	@cd docker && docker-compose exec -T backend wget -q --tries=1 --spider http://localhost:8080/health && echo "✓ Backend healthy" || echo "✗ Backend unhealthy"
	@cd docker && docker-compose exec -T frontend wget -q --tries=1 --spider http://localhost:80/health && echo "✓ Frontend healthy" || echo "✗ Frontend unhealthy"

logs: ## View all logs (follow)
	cd docker && docker-compose logs -f

logs-backend: ## View backend logs (follow)
	cd docker && docker-compose logs -f backend

logs-frontend: ## View frontend logs (follow)
	cd docker && docker-compose logs -f frontend

logs-postgres: ## View PostgreSQL logs (follow)
	cd docker && docker-compose logs -f postgres

# Database operations
db-backup: ## Backup PostgreSQL database
	@echo "Backing up database to backup_`date +%Y%m%d_%H%M%S`.sql"
	@cd docker && docker-compose exec -T postgres pg_dump -U eventos_user eventos_db > backup_$$(date +%Y%m%d_%H%M%S).sql

db-restore: ## Restore database from backup (set BACKUP_FILE=backup_20240101_120000.sql)
	@if [ -z "$(BACKUP_FILE)" ]; then \
		echo "Error: BACKUP_FILE not set. Usage: make db-restore BACKUP_FILE=backup_20240101_120000.sql"; \
		exit 1; \
	fi
	@echo "Restoring database from $(BACKUP_FILE)..."
	@cd docker && cat $(BACKUP_FILE) | docker-compose exec -T postgres psql -U eventos_user eventos_db

db-shell: ## Open PostgreSQL shell
	cd docker && docker-compose exec postgres psql -U eventos_user -d eventos_db

db-init: ## Initialize database with migrations
	@echo "Running database migrations..."
	@cd docker && docker-compose exec backend ./main migrate

# Service management
build: ## Build all images
	cd docker && docker-compose build

up: ## Start all services (development)
	cd docker && $(COMPOSE_DEV) up -d

down: ## Stop all services
	cd docker && docker-compose down

restart: ## Restart all services
	cd docker && docker-compose restart

pull: ## Pull latest base images
	docker pull postgres:16-alpine
	docker pull dpage/pgadmin4:latest
	docker pull nginx:alpine
	docker pull golang:1.25.4-alpine
	docker pull node:20-alpine

# Maintenance
prune: ## Remove unused Docker resources
	docker system prune -f
	docker volume prune -f

clean: ## Remove all containers and volumes (⚠️ deletes data)
	cd docker && docker-compose down -v --remove-orphans
	docker system prune -f

env-setup: ## Setup .env files from examples
	@echo "Setting up environment files..."
	@test -f docker/.env || cp docker/.env.example docker/.env && echo "✓ Created docker/.env"
	@test -f backend/.env || cp backend/env/.env.example backend/.env && echo "✓ Created backend/.env"
	@echo ""
	@echo "⚠️  IMPORTANT: Edit these files with production values:"
	@echo "   - docker/.env"
	@echo "   - backend/.env"

# Development utilities
shell-backend: ## Open bash in backend container
	cd docker && docker-compose exec backend sh

shell-frontend: ## Open bash in frontend container
	cd docker && docker-compose exec frontend sh

shell-postgres: ## Open PostgreSQL shell
	cd docker && docker-compose exec postgres sh

# Verification
verify: ps health ## Verify all services are running and healthy

inspect-backend: ## Inspect backend service details
	cd docker && docker-compose config --services | xargs -I {} docker-compose inspect backend

# Network inspection
network-ls: ## List Docker networks
	docker network ls

network-inspect: ## Inspect eventos_net network
	docker network inspect eventos_net

# Quick start
.DEFAULT_GOAL := help

# Quick development start
init: env-setup dev-build dev-up health ## Initialize and start development environment
	@echo ""
	@echo "✅ Development environment is ready!"
	@echo ""
	@echo "Access services at:"
	@echo "  - Frontend: http://localhost:5173"
	@echo "  - Backend API: http://localhost:8080/health"
	@echo "  - pgAdmin: http://localhost:5050"
	@echo ""
	@echo "View logs with: make logs"
	@echo "Stop services with: make down"
