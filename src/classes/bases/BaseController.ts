import { Context } from "hono";
import { BlankInput } from "hono/types";
import { AppEnv, NodeRedis, TModelInstances } from "types";

type RouteContext = Context<AppEnv, "/", BlankInput>;

export default abstract class BaseController {
  protected abstract models: TModelInstances;
  protected abstract redisClient: NodeRedis;
  constructor() {
    // this.getAll = this.getAll.bind(this);
  }

  getAll(c: RouteContext): Response | Promise<Response> {
    return c.text("get-all");
  }

  getSingle(c: RouteContext): Response | Promise<Response> {
    return c.text("get-single");
  }

  create(c: RouteContext): Response | Promise<Response> {
    return c.text("create");
  }

  update(c: RouteContext): Response | Promise<Response> {
    return c.text("update");
  }

  patch(c: RouteContext): Response | Promise<Response> {
    return c.text("patch");
  }

  delete(c: RouteContext): Response | Promise<Response> {
    return c.text("delete");
  }
}
