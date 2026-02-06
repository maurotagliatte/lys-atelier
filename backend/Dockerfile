# ---------- Stage 1: Dependencies ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---------- Stage 2: Build ----------
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx medusa build

# ---------- Stage 3: Production ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 medusa && \
    adduser --system --uid 1001 medusa

# Copy built output and runtime deps
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.medusa ./.medusa
COPY --from=builder /app/package.json ./
COPY --from=builder /app/medusa-config.ts ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/src ./src

RUN chown -R medusa:medusa /app
USER medusa

EXPOSE 9000

# Entrypoint: migrate then start
CMD ["sh", "-c", "npx medusa db:migrate && npx medusa start"]
