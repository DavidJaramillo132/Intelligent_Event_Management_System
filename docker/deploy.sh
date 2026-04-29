#!/bin/bash
# ── Production Deployment Script ──────────────────────────────────────────
# Usage: ./deploy.sh [dev|prod]

set -euo pipefail

ENVIRONMENT="${1:-dev}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$SCRIPT_DIR/docker"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Main
main() {
    cd "$DOCKER_DIR"
    
    log_info "Starting deployment for environment: $ENVIRONMENT"
    
    # Validate environment
    if [[ ! -f .env ]]; then
        log_error ".env file not found. Run: cp .env.example .env"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker-compose &> /dev/null; then
        log_error "docker-compose is not installed"
        exit 1
    fi
    
    log_info "Building Docker images..."
    if [[ "$ENVIRONMENT" == "prod" ]]; then
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
    else
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml build
    fi
    
    log_info "Starting services..."
    if [[ "$ENVIRONMENT" == "prod" ]]; then
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    else
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
    fi
    
    log_info "Waiting for services to become healthy..."
    sleep 10
    
    # Check health
    log_info "Verifying service health..."
    docker-compose ps
    
    if docker-compose exec -T postgres pg_isready -U eventos_user &> /dev/null; then
        log_info "✓ PostgreSQL is healthy"
    else
        log_error "PostgreSQL health check failed"
        exit 1
    fi
    
    if docker-compose exec -T backend wget -q --tries=1 --spider http://localhost:8080/health; then
        log_info "✓ Backend API is healthy"
    else
        log_warn "Backend API health check failed (may not be ready yet)"
    fi
    
    if docker-compose exec -T frontend wget -q --tries=1 --spider http://localhost:80/health; then
        log_info "✓ Frontend is healthy"
    else
        log_warn "Frontend health check failed (may not be ready yet)"
    fi
    
    log_info "Deployment complete!"
    log_info ""
    
    if [[ "$ENVIRONMENT" == "prod" ]]; then
        log_info "Production environment is running"
        log_warn "Remember to:"
        log_warn "1. Setup SSL/TLS certificates"
        log_warn "2. Configure reverse proxy (nginx/Traefik)"
        log_warn "3. Setup monitoring and alerting"
        log_warn "4. Configure automated backups"
        log_warn "5. Review security settings"
    else
        log_info "Development environment is running at:"
        log_info "  Frontend: http://localhost:5173"
        log_info "  Backend: http://localhost:8080"
        log_info "  pgAdmin: http://localhost:5050"
    fi
}

main "$@"
