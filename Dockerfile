# Use Node.js 2020 LTS Alpine for smaller image size
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code  
COPY src/ ./src/

# Build TypeScript
RUN pnpm run build

# Expose the port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Start the application
CMD ["pnpm", "start"]