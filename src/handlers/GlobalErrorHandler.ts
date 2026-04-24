import { HTTPException } from "hono/http-exception";
import { NotFoundError } from "errors";
import { BaseHandler } from "classes/bases";

export class GlobalErrorHandler extends BaseHandler {
  override type: "socket.io" | "general" | "error" = "error";

  constructor() {
    super();
  }

  override handle(err: unknown): void {
    const date = new Date().toISOString();
    switch (true) {
      case err instanceof HTTPException: {
        console.log(`[${date}]: ${err.message}`);
        break;
      }
      case err instanceof NotFoundError: {
        console.log(`[${date}]: ${err.message}`);
        break;
      }
      case err instanceof Error: {
        console.log(`[${date}]: ${err.message}`);
        break;
      }

      // case err instanceof NotF
      default: {
        console.log(`[${date}]: Unknown error occurred`);
        break;
      }
    }
  }
}
