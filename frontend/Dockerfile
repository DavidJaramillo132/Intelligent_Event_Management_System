# ── Multi-stage build for React + TypeScript ───────────────────────────────

# Stage 1: Build dependencies and compile
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with optimizations
RUN npm ci --only=production && \
    npm install --only=development

# Copy source code
COPY . .

# Build application
RUN npm run build

# Stage 2: Runtime - Nginx for serving static assets
FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user for nginx (already exists in nginx image)
# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/ || exit 1

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
