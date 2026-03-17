import { Context, Hono } from "hono";
import { BlankEnv, BlankInput } from "hono/types";

type RouteContext = Context<BlankEnv, "/", BlankInput>;

export default abstract class BaseController {
  abstract getAll(c: RouteContext): Hono;
}
