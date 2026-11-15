import { availableParallelism } from "node:os";
import { Dialect } from "sequelize";

export const REDIS_URL = Bun.env.REDIS_URL ?? "redis://localhost:6379";
export const PORT = Number(Bun.env.PORT ?? "8888");

// One worker per CPU by default. Port sharing (SO_REUSEPORT) only load-balances
// on Linux, so other platforms default to a single process. Set to 1 to disable.
export const CLUSTER_WORKERS = Number(
  Bun.env.CLUSTER_WORKERS ??
    (process.platform === "linux" ? availableParallelism() : 1),
);
export const IS_CLUSTER = CLUSTER_WORKERS > 1;

export const DB_DIALECT = (Bun.env.DB_DIALECT ?? "postgres") as Dialect;
export const DB_HOST = Bun.env.DB_HOST ?? "localhost";
export const DB_PORT = Number(Bun.env.DB_PORT ?? "5432");
export const DB_NAME = Bun.env.DB_NAME ?? "postgres";
export const DB_USER = Bun.env.DB_USER ?? "postgres";
export const DB_PASSWORD = Bun.env.DB_PASSWORD ?? "";
export const DB_POOL_MAX = Number(Bun.env.DB_POOL_MAX ?? "5");
export const DB_ALTER = Bun.env.DB_ALTER === "true";
