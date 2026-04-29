# 📋 Migration Guide - Old to New Docker Setup

## What Changed?

This document explains what was different in your old Docker setup and how the new one works.

---

## Before vs After Comparison

### 1. Dockerfiles

#### ❌ BEFORE: Missing Dockerfiles
```
backend/     (no Dockerfile)
  ├── main.go
  └── go.mod

frontend/    (no Dockerfile)
  ├── package.json
  └── src/
```

#### ✅ AFTER: Optimized Multi-stage Builds
```
backend/
  ├── Dockerfile (60 lines, multi-stage)
  │   ├── Stage 1: Build with golang:1.25.4-alpine
  │   └── Stage 2: Runtime with alpine:3.20 (~30MB)
  ├── .dockerignore
  └── main.go

frontend/
  ├── Dockerfile (50 lines, multi-stage)
  │   ├── Stage 1: Build with node:20-alpine
  │   └── Stage 2: Runtime with nginx:alpine (~45MB)
  ├── nginx.conf (production-grade)
  ├── .dockerignore
  └── src/
```

**Benefit**: Faster builds, smaller images, better caching

---

### 2. Environment Variables

#### ❌ BEFORE: Hardcoded Values
```yaml
# docker-compose.yml
environment:
  POSTGRES_PASSWORD: eventos_pass      # ❌ Hardcoded!
  PGADMIN_PASSWORD: admin123           # ❌ Hardcoded!
  PORT: 8080
```

#### ✅ AFTER: Properly Managed
```yaml
# docker-compose.yml
environment:
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-change_me}  # ✅ From .env
  PGADMIN_PASSWORD: ${PGADMIN_PASSWORD:-change_me}
  PORT: ${PORT:-8080}
```

```bash
# docker/.env (NEVER committed!)
POSTGRES_PASSWORD=your_actual_secure_password
PGADMIN_PASSWORD=your_actual_secure_password

# docker/.env.example (Safe to commit)
POSTGRES_PASSWORD=change_me_in_production
PGADMIN_PASSWORD=change_me_in_production
```

**Benefit**: Security - secrets not in version control

---

### 3. Port Exposure

#### ❌ BEFORE: Exposed to All Interfaces
```yaml
ports:
  - "5432:5432"     # Accessible from anywhere!
  - "8080:8080"     # Accessible from anywhere!
  - "5050:80"       # pgAdmin exposed to internet!
  - "5173:80"
```

#### ✅ AFTER: Localhost Only
```yaml
ports:
  - "127.0.0.1:5432:5432"   # Only local access
  - "127.0.0.1:8080:8080"   # Only local access
  - "127.0.0.1:5050:80"     # Only local access (admin)
  - "127.0.0.1:5173:80"     # Only local access
```

**Benefit**: Security - services not accessible from internet

---

### 4. Health Checks

#### ❌ BEFORE: Minimal Health Checks
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U eventos_user"]
  interval: 10s
  timeout: 5s
  retries: 5
  # ❌ Missing: start_period!
```

#### ✅ AFTER: Proper Health Checks
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U eventos_user"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 10s  # ✅ Wait before checking
  
# Frontend gets health check too:
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:80/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 15s
```

**Benefit**: Services startup properly before health checks

---

### 5. Resource Limits

#### ❌ BEFORE: Unlimited Resources
```yaml
services:
  postgres:
    # No limits - could use all host RAM!
    # Could cause host to crash
  
  backend:
    # No limits - could monopolize CPU!
```

#### ✅ AFTER: Proper Limits
```yaml
# Development
postgres:
  deploy:
    resources:
      limits:
        cpus: '1'
        memory: 512M
      reservations:
        cpus: '0.5'
        memory: 256M

backend:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 1G
      reservations:
        cpus: '1'
        memory: 512M
```

**Benefit**: Prevent resource exhaustion, predictable performance

---

### 6. Security Context

#### ❌ BEFORE: Running as Root
```dockerfile
# No USER directive - runs as root
# ❌ Security risk
```

#### ✅ AFTER: Non-root User
```dockerfile
# Create non-root user
RUN addgroup -g 1000 eventos && \
    adduser -D -u 1000 -G eventos eventos

# Run as non-root
USER eventos

# ✅ Secure
```

**Benefit**: Reduces attack surface

---

### 7. Docker Compose Files

#### ❌ BEFORE: Single File
```
docker/
  └── docker-compose.yml
```

#### ✅ AFTER: Separated Environments
```
docker/
  ├── docker-compose.yml         # Base (common config)
  ├── docker-compose.dev.yml     # Development overrides
  └── docker-compose.prod.yml    # Production overrides

# Usage:
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

**Benefit**: Easy environment switching, DRY principle

---

### 8. Operational Tooling

#### ❌ BEFORE: Manual Commands
```bash
# Users had to remember complex commands:
docker-compose up -d
docker-compose logs -f backend
docker-compose down -v
docker-compose exec postgres psql ...
```

#### ✅ AFTER: Makefile Commands
```bash
# Simple, memorable commands:
make up              # Start everything
make logs            # View all logs
make dev-build       # Rebuild dev
make db-backup       # Backup database
make health          # Check health
make init            # Full setup

# Show all available commands:
make help
```

**Benefit**: Easier operations, less error-prone

---

### 9. Logging

#### ❌ BEFORE: No Logging Configuration
```yaml
services:
  backend:
    # Logs go to stdout only
    # No rotation, no size limits
```

#### ✅ AFTER: Proper Logging
```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        labels: "service=backend"
```

**Benefit**: Prevents disk fill-up, JSON structured logging

---

### 10. Nginx Configuration

#### ❌ BEFORE: No Nginx
```
# Frontend served directly by Docker
# No reverse proxy
# No rate limiting
# No static caching
# No security headers
```

#### ✅ AFTER: Production-grade Nginx
```nginx
# /frontend/nginx.conf includes:
- Security headers (X-Frame-Options, CSP, etc.)
- Rate limiting (10r/s general, 30r/s for API)
- Static asset caching (1 year for immutable)
- Gzip compression
- API reverse proxy to backend
- SPA routing (try_files)
- Health check endpoint
```

**Benefit**: Better performance, security, and user experience

---

## Migration Steps

### Step 1: Update Docker Installation
```bash
# Ensure you have Docker 20.10+ and Docker Compose 2.0+
docker --version      # Should be 20.10 or higher
docker-compose --version  # Should be 2.0 or higher
```

### Step 2: Pull Latest Changes
```bash
cd /path/to/Intelligent_Event_Management_System
git pull origin main

# Verify new files exist:
ls backend/Dockerfile
ls frontend/Dockerfile
ls docker/docker-compose.dev.yml
```

### Step 3: Setup Environment Files
```bash
# Copy templates (never committed)
cp docker/.env.example docker/.env
cp backend/.env.example backend/.env

# Edit with your actual values
nano docker/.env
nano backend/.env
```

### Step 4: Test Development Environment
```bash
# Using new Makefile:
make init

# Or manually:
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml build
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d

# Check health:
make health
```

### Step 5: Verify Access
```bash
# Test all services:
curl http://localhost:8080/health        # Backend
curl http://localhost:80/health          # Frontend
# Open browser:
# - Frontend: http://localhost:5173
# - pgAdmin: http://localhost:5050
```

### Step 6: Update CI/CD (if applicable)
```bash
# If you have automated deployments, update to use:
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Or use provided script:
./docker/deploy.sh prod
```

---

## Breaking Changes

### ⚠️ Important: What Changed

| Item | Old | New | Action Required |
|------|-----|-----|-----------------|
| Dockerfiles | ❌ Missing | ✅ Created | None - use new ones |
| .env files | Hardcoded | Use .env | Create .env from .example |
| Ports | 0.0.0.0 (all IPs) | 127.0.0.1 (local) | Update firewall rules if needed |
| Compose files | Single file | 3 files (base + dev/prod) | Use both files together |
| Environment setup | Manual | `make env-setup` | Use new command |
| Database access | Direct port | Through compose | Use `make db-shell` |

### ✅ Backward Compatibility

- Old docker-compose.yml commands still work
- Services available at same URLs
- Database structure unchanged
- API endpoints unchanged

### ❌ Issues You Might Face

**Q: "Docker image not found"**
```bash
# Solution: Build new images
make dev-build
```

**Q: "Can't connect to database"**
```bash
# Make sure .env file exists:
ls docker/.env
# Check DATABASE_URL is correct
cat backend/.env | grep DATABASE_URL
```

**Q: "Port already in use"**
```bash
# Kill old containers:
docker-compose down -v
make up
```

**Q: ".env file not found error"**
```bash
# Create from template:
make env-setup
# Then edit the files with your values
```

---

## Rollback Plan

If you need to revert to the old setup:

```bash
# Restore old docker-compose.yml from git
git checkout HEAD~1 docker/docker-compose.yml

# Remove new files
rm docker/docker-compose.dev.yml
rm docker/docker-compose.prod.yml

# Stop and remove new images
docker-compose down -v
docker image prune -a

# Use old setup
docker-compose up -d
```

However, **we don't recommend this** as the new setup is significantly more robust.

---

## Validation Checklist

After migration, verify:

- [ ] `make help` shows available commands
- [ ] `make env-setup` creates .env files
- [ ] `make init` successfully starts all services
- [ ] `make health` shows all services healthy
- [ ] Frontend accessible at http://localhost:5173
- [ ] Backend health check at http://localhost:8080/health returns 200
- [ ] pgAdmin accessible at http://localhost:5050
- [ ] Database backups work: `make db-backup`
- [ ] Logs viewable: `make logs`
- [ ] No .env files in git: `git status | grep .env`

---

## Support

If you encounter issues:

1. **Check logs**: `make logs`
2. **Check health**: `make health`
3. **Review documentation**: [docker/README.md](docker/README.md)
4. **Check audit report**: [DOCKER_AUDIT.md](DOCKER_AUDIT.md)
5. **Try again**: `make clean` then `make init`

---

## Summary

| Aspect | Before | After | Benefit |
|--------|--------|-------|---------|
| Containerization | ❌ None | ✅ Multi-stage | Smaller, faster images |
| Security | ⚠️ Basic | ✅ Hardened | Production-ready |
| Operations | Manual | ✅ Automated | Less error-prone |
| Monitoring | ❌ None | ✅ Health checks | Early issue detection |
| Documentation | ❌ None | ✅ Comprehensive | Easier onboarding |
| Environments | Single | ✅ Dev/Prod | Environment parity |

**Overall**: Your Docker infrastructure has been **completely upgraded** from a development prototype to a **production-ready system**.

---

**Date**: April 28, 2026  
**Status**: Migration Complete ✅
