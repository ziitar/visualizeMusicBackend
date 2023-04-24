import { Router } from "https://deno.land/x/oak@v12.2.0/mod.ts";
import * as path from "https://deno.land/std@0.184.0/path/mod.ts";

const __dirname = path.dirname(path.fromFileUrl(import.meta.url));
const router = new Router();
router.get("/:url", async (ctx, next) => {
  let url = ctx.params.url;
  url = decodeURIComponent(url);
  try {
    const filePath = path.join(__dirname, `../assets/${url}`);
    const uint8Array = await Deno.readFile(filePath);
    ctx.response.body = uint8Array;
    ctx.response.status = 200;
    await next();
  } catch (e) {
    ctx.response.status = 404;
    ctx.response.body = e.message;
    await next();
  }
});
router.get("/proxy/:url", async (ctx, next) => {
  let url = await ctx.params.url;
  url = decodeURIComponent(url);
  const res = await fetch(url);
  ctx.response.status = res.status;
  ctx.response.headers = new Headers(res.headers);
  ctx.response.body = await res.blob();
  await next();
});
export default router;
