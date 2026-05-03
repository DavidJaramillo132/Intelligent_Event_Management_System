# 🚀 Docker Setup Quick Reference

## Status: ✅ PRODUCTION READY (8.5/10)
---

## 🎯 Quick Start

### Development Setup (3 commands)
```bash
# 1. Setup environment files
make env-setup

# 2. Start everything
make init

# 3. View logs
make logs
```

**Access:**
- Frontend: http://localhost:5173
- Backend: http://localhost:8080/health
- pgAdmin: http://localhost:5050

### Production Setup
```bash
cd docker
cp .env.example .env
# Edit .env with production values

cd ..
make prod-build
make prod-up
```

---

## 📋 Essential Commands

```bash
#Enter to WSL in the terminal
wsl

# Lifecycle
make init           # Full setup (env, build, start, health check)
make up             # Start dev environment
make down           # Stop all services
make restart        # Restart all services

# Logs & Monitoring
make logs           # View all logs (follow)
make logs-backend   # View backend logs
make logs-frontend  # View frontend logs
make health         # Check service health
make ps             # Show running containers

# Database
make db-backup      # Backup PostgreSQL
make db-restore BACKUP_FILE=backup_*.sql  # Restore
make db-shell       # Open psql shell

# Development
make dev-up         # Start dev environment
make dev-build      # Rebuild dev images
make dev-logs       # View dev logs

# Production
make prod-up        # Start prod environment
make prod-build     # Rebuild prod images
make prod-logs      # View prod logs

# Cleanup
make clean          # Remove all (DESTRUCTIVE)
make prune          # Clean Docker resources

# Full help
make help           # Show all commands
```

---

### First Time Setup
```bash
# Clone repo
git clone ...
cd Intelligent_Event_Management_System

# Copy .env template and configure
make env-setup

# Start everything
make init

# Verify health
make health
```

### Daily Development
```bash
# Start services
make up

# View logs while developing
make logs -f

# Run database commands if needed
make db-shell

# Commit changes (no .env files!)
git status  # Verify .env files not staged
git add .
git commit -m "Your changes"
```

### Deployment to Production
```bash
# Prepare production environment
cd docker
cp .env.example .env
# Edit .env with production passwords/URLs

# Deploy
cd ..
make prod-up

# Verify
make health

# Backup initial state
make db-backup
```

---

## 🐛 Troubleshooting

### Backend can't connect to PostgreSQL
```bash
# Check database is running
make ps

# View backend logs
make logs-backend

# Check DATABASE_URL in backend/.env
cat backend/.env | grep DATABASE_URL
```

### High memory usage
```bash
# Check resource usage
docker stats

# Reduce limits in docker-compose.yml
# Restart services
make restart
```

### Images too large
```bash
# Clean unused images
make prune

# Rebuild without cache
make clean
make dev-build
```

### Can't access frontend
```bash
# Check frontend logs
make logs-frontend

# Verify nginx is running
docker-compose ps frontend

# Check port binding
docker port eventos_frontend
```

---

## 📈 Performance Tips

1. **Layer Caching**: Push less-changed layers first (go.mod before *.go)
2. **Resource Limits**: Prevent runaway services from crashing others
3. **Health Checks**: Detect issues early with proper start_period
4. **Logging**: JSON driver with rotation prevents disk fill-up
5. **Nginx Caching**: 1-year cache for immutable assets (JS/CSS)
6. **Database Pooling**: Connection reuse prevents exhaustion

---

## 📚 Files to Know

| File | Purpose |
|------|---------|
| `docker/docker-compose.yml` | Main orchestration file |
| `docker/docker-compose.dev.yml` | Development overrides |
| `docker/docker-compose.prod.yml` | Production overrides |
| `backend/Dockerfile` | Go multi-stage build |
| `frontend/Dockerfile` | Node+Nginx build |
| `frontend/nginx.conf` | Nginx configuration |
| `docker/.env.example` | Environment template |
| `backend/.env.example` | Backend config template |
| `Makefile` | Operational commands |
| `DOCKER_AUDIT.md` | Full audit report |

---

## 🔐 Environment Variables

### Create .env files before running:

**docker/.env:**
```env
POSTGRES_USER=eventos_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=eventos_db
PGADMIN_EMAIL=admin@eventos.com
PGADMIN_PASSWORD=your_secure_password
PORT=8080
ENV=development
LOG_LEVEL=info
TIMEZONE=America/Guayaquil
```

**backend/.env:**
```env
DATABASE_URL=host=postgres user=eventos_user password=your_secure_password dbname=eventos_db port=5432 sslmode=disable
PORT=8080
ENV=development
```

⚠️ **Never commit .env files** - they're in .gitignore for this reason!

---

## 🎬 Common Workflows

### Add New Backend Route
```bash
# 1. Edit backend code
vim backend/router/routes.go

# 2. Rebuild and restart
make dev-build
make restart

# 3. Check logs
make logs-backend
```

### Update Frontend
```bash
# 1. Edit React code
vim frontend/src/App.tsx

# 2. Frontend auto-rebuilds on save (Vite)
# 3. Check browser at http://localhost:5173

# 4. Rebuild Docker image when needed
make dev-build
make restart
```

### Database Backup & Restore
```bash
# Backup
make db-backup
# Creates: backup_20240428_120000.sql

# Restore
make db-restore BACKUP_FILE=backup_20240428_120000.sql
```

---