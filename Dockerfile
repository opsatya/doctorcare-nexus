# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy only frontend-related files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./

# Copy frontend source
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./

# Install deps & build
RUN npm ci && npm run build


# Stage 2: Setup backend and serve frontend
FROM node:18-alpine AS production

WORKDIR /app

# Install backend deps
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend code
COPY backend/ .

# Copy built frontend files into backend's public folder
COPY --from=frontend-builder /app/dist ./public

# Copy custom server (new: as real file)
COPY backend/server-with-frontend.js ./server-with-frontend.js

# Replace default start script in package.json
RUN sed -i 's/"start": "node server.js"/"start": "node server-with-frontend.js"/' package.json

# Expose app port
EXPOSE 3001

# Install curl for health check
RUN apk add --no-cache curl

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/doctors || exit 1

# Start server
CMD ["npm", "start"]
