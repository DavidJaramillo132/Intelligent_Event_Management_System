# Intelligent Event Management System - Docker Deployment Guide

## 📋 Quick Start

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum (8GB recommended)
- 10GB disk space

### Development Deployment

```bash
# Navigate to docker directory
cd docker

# Create .env from example
cp .env.example .env

# Start services (development)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Check services status
docker-compose ps

# View logs
docker-compose logs -f
```

### Production Deployment

```bash
# Navigate to docker directory
cd docker

# Create .env from example and customize
cp .env.example .env
# Edit .env with production values:
# - Strong passwords
# - Proper database credentials
# - Production API URLs

# Start services (production)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check services status
docker-compose ps
```

## 🔧 Service Configuration

### Environment Variables

Create a `.env` file in the `docker/` directory:

```bash
# PostgreSQL
POSTGRES_USER=eventos_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=eventos_db

# pgAdmin
PGADMIN_EMAIL=admin@eventos.com
PGADMIN_PASSWORD=your_secure_password

# Backend
PORT=8080
ENV=production
LOG_LEVEL=info

# Timezone
TIMEZONE=America/Guayaquil
```

### Database Initialization

Place SQL scripts in `docker/db/init/` directory:
- Files are executed in alphabetical order on first container startup
- Only runs on fresh volume creation

Example: `docker/db/init/01-init-schema.sql`

## 📊 Service Details

### PostgreSQL (Port 5432)
- Image: `postgres:16-alpine`
- Health check: ✅ Enabled (10s interval)
- Resource limits: 1 CPU, 512MB RAM
- Data persistence: Volume `postgres_data`
- Security: Non-root user, no-new-privileges

### pgAdmin (Port 5050)
- Image: `dpage/pgadmin4:latest`
- Health check: ✅ Enabled (30s interval)
- Resource limits: 0.5 CPU, 256MB RAM
- Security: Read-only filesystem, confined tmpfs
- ⚠️ Development only - DO NOT expose in production

### Backend API (Port 8080)
- Build: Multi-stage Docker build (optimized ~50MB image)
- Language: Go 1.25.4
- Health check: ✅ Enabled (30s interval)
- Resource limits: 2 CPU, 1GB RAM
- Security: Non-root user (uid: 1000), read-only root filesystem
- Database: PostgreSQL (via gorm)
- Endpoints: `/health`, `/api/*`

### Frontend (Port 5173/80)
- Build: Multi-stage build (Node.js build + Nginx runtime)
- Framework: React 19 + TypeScript + Vite
- Server: Nginx Alpine
- Health check: ✅ Enabled (30s interval)
- Resource limits: 1 CPU, 512MB RAM
- Security: Read-only filesystem, no-new-privileges
- Static asset caching: 1 year (immutable)
- API proxy: Reverse proxy to backend via `/api`

## 🛡️ Security Features

✅ **Implemented:**
- Non-root user execution
- Read-only root filesystems
- Health checks on all services
- Resource limits (CPU, Memory)
- No privileged mode
- Secure tmpfs for temporary data
- Network isolation (internal bridge network)
- Localhost binding (127.0.0.1) for ports
- Security headers in Nginx (X-Frame-Options, etc.)
- JSON logging driver with rotation

⚠️ **Production Recommendations:**
1. Use reverse proxy (nginx/Traefik) for external access
2. Enable SSL/TLS with Let's Encrypt
3. Keep all admin ports (5050) internal only
4. Use strong, unique passwords
5. Regular database backups
6. Monitor resource usage and logs
7. Implement automated health monitoring
8. Set up centralized logging

## 📈 Performance Optimizations

- **Multi-stage Docker builds**: Reduced final image sizes
- **Alpine base images**: Smaller attack surface, faster startup
- **BuildKit caching**: Leverage Docker layer caching
- **Connection pooling**: PostgreSQL connection limits
- **Gzip compression**: Nginx static content compression
- **Browser caching**: 1-year immutable asset caching
- **Rate limiting**: Nginx request limiting
- **Resource limits**: Prevent resource exhaustion

## 🔄 Common Operations

### View Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend

# Follow logs (tail -f)
docker-compose logs -f frontend
```

### Access Services

**pgAdmin**: http://localhost:5050
- Email: admin@eventos.com
- Password: (from .env)

**Backend API**: http://localhost:8080/health

**Frontend**: http://localhost:5173

### Rebuild Images
```bash
# Rebuild all
docker-compose build

# Rebuild specific service
docker-compose build backend

# No cache
docker-compose build --no-cache
```

### Database Access
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U eventos_user -d eventos_db

# Backup database
docker-compose exec postgres pg_dump -U eventos_user eventos_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U eventos_user eventos_db < backup.sql
```

### Scale Services
```bash
# Scale backend to 3 replicas (only without host port binding)
docker-compose up -d --scale backend=3
```

### Clean Up
```bash
# Stop services
docker-compose down

# Remove volumes (⚠️ deletes data)
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

## 🐛 Troubleshooting

### Backend can't connect to PostgreSQL
- Check database is running: `docker-compose ps`
- Verify DATABASE_URL in backend .env
- Check logs: `docker-compose logs postgres backend`

### Frontend can't reach backend API
- Verify backend is running on port 8080
- Check nginx.conf API proxy configuration
- Verify VITE_API_URL in frontend environment

### Out of disk space
```bash
# Clean Docker system
docker system prune -a

# Remove unused volumes
docker volume prune
```

### High memory usage
- Reduce resource limits in docker-compose.yml
- Check application logs for memory leaks
- Scale services across multiple hosts

## 📚 Advanced Topics

### Custom Nginx Configuration
Edit `frontend/nginx.conf` to modify:
- Cache settings
- Rate limiting
- Security headers
- API proxy rules

### Database Initialization Scripts
Place .sql files in `docker/db/init/`:
```sql
-- db/init/01-create-tables.sql
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Multi-host Deployment
For production with multiple hosts, consider:
- Docker Swarm for orchestration
- Kubernetes for advanced features
- External volume drivers (NFS, EBS)
- Centralized logging (ELK, Splunk)
- Monitoring stack (Prometheus, Grafana)

### SSL/TLS Termination
Deploy nginx reverse proxy with Let's Encrypt:
```bash
# Example with Traefik (automatic SSL)
docker pull traefik:latest
```

## 📞 Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Review configuration files
3. Verify environment variables
4. Ensure sufficient resources
5. Check Docker daemon status

---

**Last Updated**: April 2026  
**Docker Compose Version**: 3.9  
**Go Version**: 1.25.4  
**Node Version**: 20 (Alpine)
