# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

RUN npm ci --only=production && npm cache clean --force

# Create logs and uploads directories
RUN mkdir -p logs uploads && chown -R nodejs:nodejs logs uploads

USER nodejs

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
