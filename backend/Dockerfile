# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# su-exec for dropping root in entrypoint (Alpine)
RUN apk add --no-cache su-exec

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application files
COPY server.js ./
COPY src ./src
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

# Create uploads directories (volume mount will override; entrypoint fixes permissions)
RUN mkdir -p uploads/avatars uploads/company_logos && \
    chown -R nodejs:nodejs /app

# Run as root so entrypoint can chown volume; entrypoint drops to nodejs
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "server.js"]

