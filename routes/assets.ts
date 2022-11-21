import { Router } from "https://deno.land/x/oak@v10.2.1/mod.ts";

const router = new Router();

router.get("/:url", async (ctx, next) => {
  let url = ctx.params.url;
  url = decodeURIComponent(url);
  try {
    const realPath = await Deno.realPath(`./assets/${url}`);
    const uint8Array = await Deno.readFile(realPath);
    ctx.response.body = uint8Array;
    ctx.response.status = 200;
    await next();
  } catch (e) {
    ctx.response.status = 404;
    ctx.response.body = e.message;
    await next();
  }
});

export default router;
