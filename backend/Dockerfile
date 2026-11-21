FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# Production Runner
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY public/ ./public/
COPY src/database/schema.sql ./dist/database/schema.sql
COPY src/database/seed.sql ./dist/database/seed.sql

USER node

EXPOSE 3000

CMD ["node", "dist/index.js"]
