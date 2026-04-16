# ---- Build Stage ----
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# ---- Runtime Stage ----
FROM node:18-alpine

WORKDIR /app

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app .

RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
