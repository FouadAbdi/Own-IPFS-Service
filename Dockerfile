# Use Node.js LTS version as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create data directory
RUN mkdir -p /app/data

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application source code
COPY src/ ./src/
COPY public/ ./public/
COPY cli.js ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of app directory to nodejs user
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/stats || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV DATA_DIR=/app/data

# Start the application
CMD ["npm", "start"]
