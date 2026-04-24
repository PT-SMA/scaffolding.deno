import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { NotFoundError } from "errors";
import { BaseHandler } from "classes/bases";

export class AppErrorHandler extends BaseHandler {
  override type: "socket.io" | "general" | "error" = "error";

  constructor() {
    super();
  }

  handle404(c: Context) {
    return c.json(
      {
        errors: [
          {
            msg: `Cannot find the route of ${c.req.path}`,
          },
        ],
      },
      404,
    );
  }

  override handle(err: unknown, c: Context): Response {
    switch (true) {
      case err instanceof HTTPException: {
        return err.getResponse();
      }
      case err instanceof NotFoundError: {
        return c.json(
          {
            errors: [
              {
                msg: err.message,
                name: err.name,
              },
            ],
          },
          err.statusCode,
        );
      }
      case err instanceof Error: {
        return c.json(
          {
            errors: [
              {
                msg: err.message,
                name: err.name,
              },
            ],
          },
          500,
        );
      }
      // case err instanceof NotF
      default: {
        return c.json(
          {
            errors: [
              {
                msg: "Unknown error occurred",
              },
            ],
          },
          500,
        );
      }
    }
  }
}
