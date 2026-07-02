# ──────────────────────────────────────────────────────────────────────────────
# Nebula — Production Dockerfile (Section 24.9 Containerisation)
#
# Multi-stage build:
#   Stage 1 (builder): Install deps and build production assets
#   Stage 2 (runtime): Serve static assets via nginx on port 80
#
# Security practices (Section 24.9 & 24.22):
#   - Non-root user
#   - Minimal base image (alpine)
#   - No unnecessary packages
#   - Health endpoint exposed via nginx
# ──────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer-cache friendly)
COPY package*.json ./
RUN npm ci --frozen-lockfile

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Production Runtime ───────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Remove default nginx html
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config for SPA routing (React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Run nginx as non-root (Section 24.9 — least privilege)
RUN addgroup -S nebula && adduser -S nebula -G nebula \
  && chown -R nebula:nebula /usr/share/nginx/html \
  && chown -R nebula:nebula /var/cache/nginx \
  && chown -R nebula:nebula /var/log/nginx \
  && touch /var/run/nginx.pid \
  && chown nebula:nebula /var/run/nginx.pid

USER nebula

EXPOSE 80

# Health check (Section 24.18)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
