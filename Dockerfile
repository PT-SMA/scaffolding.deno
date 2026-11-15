FROM oven/bun:1.4

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY . .

ENV NODE_ENV=production
EXPOSE 8888

# Runs as a cluster (one worker per CPU) by default; override with CLUSTER_WORKERS.
CMD ["bun", "main.ts"]
