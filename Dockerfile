# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Run build script to produce client assets and the server bundle
RUN npm run build

# Stage 2: Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment configurations
ENV NODE_ENV=production
ENV PORT=3000

# Copy package configurations for production dependency installation
COPY package*.json ./

# Install ONLY production dependencies to keep the image slim and secure
RUN npm ci --only=production

# Copy compiled application code and static assets from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/schema-mysql.sql ./schema-mysql.sql

# Expose port 3000 (standard for Coolify reverse-proxy ingress)
EXPOSE 3000

# Start the Node.js Express + Vite server
CMD ["npm", "start"]
