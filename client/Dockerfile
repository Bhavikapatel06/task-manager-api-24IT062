# ==========================================
# Frontend Dockerfile (Multi-stage build)
# ==========================================

# Stage 1: Build stage
FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production runtime stage (Multi-stage build to reduce image size)
FROM node:18-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm install --include=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/vite.config.js ./
EXPOSE 5173
CMD ["npm", "run", "preview", "--", "--host"]
