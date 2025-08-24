# Build-Stage
FROM node:18-alpine AS builder
WORKDIR /app
ENV npm_config_legacy_peer_deps=true
COPY package.json package-lock.json ./
RUN npm ci
RUN npm install @astrojs/node
COPY . .
RUN npm run build

# Runtime-Stage
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
EXPOSE 3000
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
ENV HOST=0.0.0.0
ENV PORT=4321
CMD ["node", "dist/server/entry.mjs"]