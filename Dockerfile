FROM node:20-slim AS builder

WORKDIR /app

RUN npm config set registry https://registry.npmjs.org/

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Generate migration files (no DB connection needed)
RUN npx drizzle-kit generate

# ── Production image ────────────────────────────────────────────────────────
FROM node:20-slim

WORKDIR /app

RUN npm config set registry https://registry.npmjs.org/

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/index.cjs"]
