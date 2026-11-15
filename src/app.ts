import cluster from "node:cluster";
import { Hono } from "hono";
import { Router } from "routes";
import { redisClient } from "modules";
import { createModels } from "models";
import { Server } from "socket.io";
import { Server as Engine, type WebSocketData } from "@socket.io/bun-engine";
import { createAdapter } from "@socket.io/redis-adapter";
import { cors } from "hono/cors";
import { AppErrorHandler, SocketHandler } from "handlers";
import { DB_ALTER, IS_CLUSTER } from "consts";

export class MainApp {
  name = "scaffolding.bun"; // <- change this with the app's name
  private app = new Hono();
  private io = new Server();
  private engine = new Engine({
    path: "/socket.io/",
    cors: {
      origin: "*",
    },
    // Cluster workers share the port without sticky sessions, so HTTP
    // long-polling (several requests per session) can't work — WebSocket only.
    ...(IS_CLUSTER && {
      allowRequest: (req: Request) => {
        if (!req.headers.has("upgrade")) {
          return Promise.reject("Only the websocket transport is allowed");
        }
        return Promise.resolve();
      },
    }),
  });
  private engineHandler = this.engine.handler();
  private errorHandler = new AppErrorHandler();
  private models = createModels();

  constructor() {
    this.init = this.init.bind(this);
    this.initRoutes = this.initRoutes.bind(this);
    this.initSocket = this.initSocket.bind(this);
    this.initRedis = this.initRedis.bind(this);
    this.initDB = this.initDB.bind(this);
  }

  async init() {
    await this.initRedis();
    await this.initSocket();
    await this.initDB();
    await this.initRoutes();
  }

  private async initRoutes() {
    const router = new Router(this.models);
    await router.initiateRoutes();

    this.app.use(
      "/*",
      cors({
        origin: "*",
      }),
    );

    this.app.get("/", (c) => {
      return c.json({
        appName: this.name,
      });
    });

    this.app.route("/", router.apiRoute);
    this.app.onError(this.errorHandler.handle);
    this.app.notFound(this.errorHandler.handle404);
  }

  private async initSocket() {
    // Redis adapter: io.emit / io.to(room) reach sockets on every worker.
    const pubClient = redisClient.duplicate();
    const subClient = redisClient.duplicate();
    pubClient.on("error", (err) => console.error("Redis (io pub) error:", err));
    subClient.on("error", (err) => console.error("Redis (io sub) error:", err));
    await Promise.all([pubClient.connect(), subClient.connect()]);
    this.io.adapter(createAdapter(pubClient, subClient));

    this.io.bind(this.engine);
    this.io.on("connection", (socket) => {
      const handler = new SocketHandler(socket);
      handler.handle();
    });
  }

  private async initRedis() {
    redisClient.on("error", (err) => console.error("Redis error:", err));
    await redisClient.connect();
  }

  private async initDB() {
    // In a cluster only the first worker alters the schema.
    const isLeader = cluster.isPrimary || cluster.worker?.id === 1;
    if (DB_ALTER && isLeader) {
      await this.models.sequelize.sync({ alter: true });
    } else {
      await this.models.sequelize.authenticate({ logging: false });
    }
  }

  handler = (req: Request, server: Bun.Server<WebSocketData>) => {
    if (new URL(req.url).pathname === "/socket.io/") {
      return this.engine.handleRequest(req, server);
    }
    return this.app.fetch(req, server);
  };

  // Taken individually: spreading engine.handler() would also apply its 1 MB
  // maxRequestBodySize to every HTTP route.
  websocket = this.engineHandler.websocket;
  idleTimeout = this.engineHandler.idleTimeout; // > socket.io pingInterval
}
