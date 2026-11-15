# Bun Backend Template

This repository will be a template for creating backend for future projects.
Runs on [Bun](https://bun.sh) (>= 1.4) with Hono, socket.io, Redis and
Sequelize (pg).

## Before running

Before you run the project, you would likely need to run this command:
`bun install`

## Available resources

- File based routing (subrouting included). Route files call utils directly —
  there are no controllers.
- `utils` — reusable logic classes extending `BaseUtil` (`this.redisClient`,
  `this.models`), grouped by `routes`, `middlewares` and `others`.
- `middlewares` — Hono middlewares (`createMiddleware`) that delegate to a util
  and set context variables.
- `modules` — specific-case infrastructure (Redis client, event emitter).
- `helpers` — small, pure functions only.
- `handlers` — event-related code (socket.io, pub/sub, error handling) extending
  `BaseHandler`.
- Models — memoized `createModels()` (Sequelize + pg), one pool per process.
- Import aliases (`app`, `routes`, `handlers`, `utils`, `consts`, `types`, …)
  are defined in `tsconfig.json` `paths`.

## Cluster

The app runs as a cluster by default (`node:cluster`): the primary process forks
one worker per CPU, and every worker serves the same port via `reusePort`
(SO_REUSEPORT), with the kernel balancing connections between them.

- `CLUSTER_WORKERS` — number of workers. Defaults to the CPU count on Linux and
  to `1` elsewhere (port sharing only load-balances on Linux). `1` runs a single
  process without forking.
- A worker that crashes is restarted. If a worker fails during startup (e.g.
  Redis/DB unreachable) the whole app exits with code 1 instead of crash-looping.
- socket.io is **WebSocket-only** in cluster mode (there are no sticky sessions,
  so HTTP long-polling can't work). Clients must connect with
  `io(url, { transports: ["websocket"] })`.
- socket.io uses the Redis adapter, so `io.emit` / `io.to(room).emit` reach
  clients connected to any worker.
- With `DB_ALTER=true`, only the first worker runs `sequelize.sync({ alter })`.
- Per-process state (module-level variables, the in-memory event emitter) is not
  shared between workers — use Redis for anything that must be.

## Development

`bun dev` (watch mode) — `bun start` for production — `bun run typecheck`

Editor settings are included for VS Code (`.vscode`) and Zed (`.zed`). The Zed
settings switch TypeScript to `vtsls` and Prettier, and disable the Deno
language server for this project.
