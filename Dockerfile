# syntax=docker/dockerfile:1.6

FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
RUN apk add --no-cache python3 make g++ \
  && ln -sf python3 /usr/bin/python
COPY package.json bun.lock ./
COPY prisma ./prisma
RUN npm install

FROM deps AS builder
COPY . .
RUN npm run build

FROM base AS dev
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
CMD ["npm", "run", "dev"]

FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000
COPY --from=builder /app ./
RUN addgroup -g 1001 nodejs \
  && adduser -S nextjs -u 1001
USER nextjs
CMD ["npm", "run", "start"]
