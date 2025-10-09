# Multi-stage build for React + Node.js application
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source code
COPY frontend/ ./
RUN npm run build

# Backend stage
FROM node:18-alpine AS backend

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy backend source code
COPY backend/ ./

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/frontend/dist ./public

# Create uploads directory structure
RUN mkdir -p uploads/avatars

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of uploads directory
RUN chown -R nextjs:nodejs uploads

# Switch to non-root user
USER nextjs

# Expose port (configurable via environment)
EXPOSE ${PORT:-3000}

# Note: Environment variables should be passed at runtime:
# docker run -e DB_HOST=localhost -e DB_PORT=5432 -e DB_NAME=pricelist-app-3 ...
# or use docker-compose.yml with env_file

# Health check using Node.js instead of wget (more reliable)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "const http = require('http'); \
    const options = { host: 'localhost', port: process.env.PORT || 3000, path: '/health', timeout: 2000 }; \
    const req = http.request(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); \
    req.on('error', () => process.exit(1)); \
    req.on('timeout', () => process.exit(1)); \
    req.end();"

# Start the application
CMD ["npm", "start"]
