# ════════════════════════════════════════════════
# Stage 1 – Builder  (Node 20 Alpine)
# Installs deps and runs Vite production build
# ════════════════════════════════════════════════
FROM node:20-alpine AS builder

WORKDIR /app

# Accept API key and env label as build-time args
# (baked into the static JS bundle by Vite)
ARG VITE_WEATHER_API_KEY
ARG VITE_ENV_LABEL=production
ENV VITE_WEATHER_API_KEY=${VITE_WEATHER_API_KEY}
ENV VITE_ENV_LABEL=${VITE_ENV_LABEL}

# Install dependencies first (layer cache friendly)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build

# ════════════════════════════════════════════════
# Stage 2 – Runtime  (Nginx Alpine)
# Serves the compiled static files; tiny footprint
# ════════════════════════════════════════════════
FROM nginx:1.25-alpine

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf 2>/dev/null; \
    rm -f /etc/nginx/nginx.conf

# Copy our custom config and built assets
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Health check — hits the /health endpoint we defined in nginx.conf
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
