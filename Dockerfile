# Stage 1: Build
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile --config.confirmModulesPurge=false
COPY . .
RUN pnpm run build

# Stage 2: Production
FROM node:20-slim
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/patches/ ./patches/
RUN pnpm install --prod --frozen-lockfile --config.confirmModulesPurge=false

EXPOSE 3000
CMD ["node", "dist/index.js"]
