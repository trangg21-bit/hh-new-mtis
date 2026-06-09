# ─── Stage 1: Build ────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ─── Stage 2: Runtime ──────────────────────────────────
FROM node:22-alpine

RUN addgroup -S mtis && adduser -S mtis -G mtis

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY src/ ./src/

# Fix permissions on data directory for bind-mount compatibility
RUN mkdir -p /app/data /app/data/backups && chown -R mtis:mtis /app

USER mtis

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http=require('http');http.get('http://localhost:3000/api/health',r=>{process.exit(r.statusCode===200?0:1)})"

CMD ["node", "src/index.js"]
