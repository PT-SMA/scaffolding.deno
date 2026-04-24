import * as path from "@std/path";
import { isNonNullish } from "helpers";
import { Hono } from "hono";

export class Router {
  private routes: Array<string> = [];
  apiRoute = new Hono().basePath("/api");
  routers: Array<Hono> = [];
  constructor() {
    this.checkDir();

    this.initiateRoutes = this.initiateRoutes.bind(this);
  }

  async initiateRoutes() {
    await Promise.all(
      this.routes.map(async (route) => {
        const filePath = path.relative(
          path.resolve(Deno.cwd(), "src", "routes"),
          route,
        );
        const dirPath = path.dirname(filePath);
        const module = await import(`./${filePath}`).then((v) => v.default);

        if (typeof module === "function") {
          const filename = this.getFilename(filePath);
          if (dirPath === ".") {
            this.apiRoute.route(`/${filename}`, module());
          } else {
            this.apiRoute.route(`/${dirPath}`, module());
          }
        }
      }),
    );
  }

  private checkDir(dirPath?: string) {
    const routeBasePath = path.fromFileUrl(import.meta.url);
    let cwd = path.dirname(routeBasePath);
    if (isNonNullish(dirPath)) {
      cwd = path.join(path.dirname(routeBasePath), dirPath);
    }

    const files = Array.from(Deno.readDirSync(cwd)).filter(
      (file) => file.name !== "index.ts",
    );

    for (const file of files) {
      if (file.isFile) {
        const filePath = path.join(cwd, file.name);
        this.routes.push(filePath);
      } else if (!file.isFile && file.isDirectory) {
        this.checkDir(file.name);
      }
    }
  }

  private getFilename(filePath: string) {
    const ext = path.extname(filePath);
    const fileWithoutExt = filePath.substring(0, filePath.length - ext.length);

    return fileWithoutExt;
  }
}

// debug only
if (import.meta.main) {
  new Router();
}
