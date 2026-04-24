import { Hono } from "hono";
import { Router } from "routes";
import { redisClient } from "modules";
import { Server } from "socket.io";
import { cors } from "hono/cors";
import { AppErrorHandler } from "handlers";

export class MainApp {
  name = "scaffolding.deno"; // <- change this with the app's name
  private app = new Hono();
  private io = new Server({
    cors: {
      origin: "*",
    },
  });
  private errorHandler = new AppErrorHandler();

  constructor() {
    this.initRoutes = this.initRoutes.bind(this);
    this.redisInit = this.redisInit.bind(this);

    this.initSocket();
    this.initRoutes();
    this.redisInit();
  }

  private async initRoutes() {
    const router = new Router();
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

  private initSocket() {
    this.io.on("connection", (socket) => {
      console.log(socket.id);

      socket.on("disconnect", (reason) => {
        console.log(reason, "disconnect reason");
      });
    });
  }

  private async redisInit() {
    await redisClient.connect();
    redisClient.on("error", (err) => console.error("Redis error:", err));
  }

  handler = this.io.handler(async (req) => {
    return (await this.app.fetch(req)) || new Response([], { status: 404 });
  });
}
