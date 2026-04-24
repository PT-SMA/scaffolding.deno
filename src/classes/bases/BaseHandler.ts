/**
 * Handler is an abstraction for handling external data using WebSocket (socket.io) or custom event handler
 *
 */

export abstract class BaseHandler {
  abstract type: "socket.io" | "general" | "error";

  constructor() {
    this.handle = this.handle.bind(this);
  }

  abstract handle(...args: unknown[]): void | unknown;
}
