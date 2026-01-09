# Use Node 20 as base image
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Generate migrations
RUN npx drizzle-kit generate

# Production image
FROM node:20-slim

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy built assets and migrations
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Start command
CMD ["node", "dist/index.cjs"]
