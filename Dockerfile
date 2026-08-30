FROM node:22-slim AS builder

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-slim

WORKDIR /app
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY backend ./backend
COPY frontend ./frontend

ENV PORT=3001
EXPOSE 3001

WORKDIR /app/backend
CMD ["node", "src/server.js"]
