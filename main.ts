import { Hono } from "hono";
import { cors } from "hono/cors";
import { Router } from "routes";
import { PORT } from "consts";
import { redisClient } from "modules";
import { Server } from "socket.io";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/available-routes", (c) => {
  return c.json({
    data: app.routes,
  });
});

app.use(
  "/*",
  cors({
    origin: "*",
  }),
);

const router = new Router();
await router.initiateRoutes();
app.route("/", router.apiRoute);
await redisClient.connect();

redisClient.on("error", (err) => console.log("Redis error:", err));

const io = new Server({
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log(socket.id);

  socket.on("disconnect", (reason) =>
    console.log(reason === "client namespace disconnect"),
  );
});

const handler = io.handler(async (req) => {
  return (await app.fetch(req)) || new Response([], { status: 404 });
});

Deno.serve({ port: PORT }, handler);
