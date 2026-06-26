FROM node:20-slim AS builder

WORKDIR /app

# Force public npm registry — avoids any Replit-internal proxy URLs in lock file
RUN npm config set registry https://registry.npmjs.org/

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Production image ────────────────────────────────────────────────────────
FROM node:20-slim

WORKDIR /app

RUN npm config set registry https://registry.npmjs.org/

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/index.cjs"]
