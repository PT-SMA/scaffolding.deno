export const REDIS_URL = Deno.env.get("REDIS_URL") ?? "redis://localhost:6379";
export const PORT = Number(Deno.env.get("PORT") ?? "8888");
