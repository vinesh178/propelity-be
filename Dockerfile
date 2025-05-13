FROM node:22.14.0-alpine AS build

# Set working directory
WORKDIR /app

# Update Alpine packages and install security updates
RUN apk update && apk upgrade --no-cache && \
    rm -rf /var/cache/apk/*

# Copy only package.json and package-lock.json to leverage Docker cache
COPY package*.json ./

# Install all dependencies including dev dependencies needed for build
RUN npm ci --no-optional --ignore-scripts

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build
# Prune dev dependencies for production
RUN npm prune --production
# Runtime stage
FROM node:22.14.0-alpine

# Update Alpine packages and install security updates
RUN apk update && apk upgrade --no-cache && \
    rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Create a non-root user and group with explicit IDs to avoid conflicts
RUN addgroup -S -g 1001 appgroup && \
    adduser -S -u 1001 -G appgroup appuser

# Copy only necessary artifacts from build stage
COPY --from=build --chown=appuser:appgroup /app/dist ./dist
COPY --from=build --chown=appuser:appgroup /app/public ./public
COPY --from=build --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=build --chown=appuser:appgroup /app/package.json ./
# Copy src directory for email templates and other resources
COPY --from=build --chown=appuser:appgroup /app/src ./src

# Set proper permissions for the application directory
RUN chown -R appuser:appgroup /app && \
    chmod -R 750 /app

# Switch to non-root user
USER appuser

# Expose the port the app runs on (non-privileged port)
EXPOSE 3000

# Set environment variables to reduce Node.js vulnerabilities
ENV NODE_ENV=production \
    NPM_CONFIG_LOGLEVEL=error

# Add healthcheck for better monitoring
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Command to run the application
CMD ["node", "dist/index.js"]