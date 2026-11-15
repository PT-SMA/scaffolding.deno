import cluster, { type Worker } from "node:cluster";
import { MainApp } from "app";
import { CLUSTER_WORKERS, IS_CLUSTER, PORT } from "consts";
import { GlobalErrorHandler } from "handlers";

const READY = "ready";

/** Primary process: forks the workers and keeps them alive. */
function startPrimary() {
  const ready = new Set<number>();
  let shuttingDown = false;

  const shutdown = (code: number) => {
    shuttingDown = true;
    for (const worker of Object.values(cluster.workers ?? {})) {
      worker?.kill();
    }
    process.exit(code);
  };

  cluster.on("message", (worker: Worker, message: unknown) => {
    if (message === READY) ready.add(worker.id);
  });

  cluster.on("exit", (worker, code, signal) => {
    if (shuttingDown) return;

    if (!ready.has(worker.id)) {
      // Failed during startup (e.g. Redis/DB unreachable) — respawning would
      // just crash-loop, so fail fast like a single process would.
      console.error(
        `Worker ${worker.process.pid} failed to start (code ${code}), shutting down.`,
      );
      shutdown(1);
      return;
    }

    ready.delete(worker.id);
    console.error(
      `Worker ${worker.process.pid} died (${signal ?? `code ${code}`}), restarting.`,
    );
    cluster.fork();
  });

  for (const sig of ["SIGINT", "SIGTERM"] as const) {
    process.on(sig, () => shutdown(0));
  }

  for (let i = 0; i < CLUSTER_WORKERS; i++) {
    cluster.fork();
  }

  console.log(`Primary ${process.pid}: ${CLUSTER_WORKERS} workers on :${PORT}`);
}

/** Worker (or single) process: runs the app. */
async function startServer() {
  try {
    const app = new MainApp();
    await app.init();
    Bun.serve({
      port: PORT,
      reusePort: IS_CLUSTER,
      fetch: app.handler,
      websocket: app.websocket,
      idleTimeout: app.idleTimeout,
    });
    process.send?.(READY);
  } catch (err) {
    const errHandler = new GlobalErrorHandler();
    errHandler.handle(err);
    process.exit(1);
  }
}

if (import.meta.main) {
  if (IS_CLUSTER && cluster.isPrimary) {
    startPrimary();
  } else {
    await startServer();
  }
}
