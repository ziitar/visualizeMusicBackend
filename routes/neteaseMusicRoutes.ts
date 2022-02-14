import { helpers, Router } from "https://deno.land/x/oak@v10.2.1/mod.ts";
import { createWebAPIRequest } from "../utils/neteaseMusicAPI/util.ts";
import { Session } from "https://deno.land/x/oak_sessions@v3.2.5/mod.ts";

const router = new Router<{ session: Session }>();

router.get("/search/:keywords", async (ctx, next) => {
  const s = ctx.params.keywords;
  const { limit, offset, type } = helpers.getQuery(ctx);
  if (s) {
    const NEM_cookie = await ctx.state.session.get("NEM_cookie") as string;
    const csrf_token = await ctx.state.session.get("NEM_csrf_token") as string;
    await createWebAPIRequest(
      "music.163.com",
      "/weapi/search/get",
      {
        s: s,
        limit: limit || 10,
        type: type || 1,
        csrf_token: csrf_token || "",
        offset: offset || 0,
      },
      NEM_cookie || "",
      "POST",
      async (res, cookie) => {
        if (cookie) {
          ctx.state.session.set("NECookie", cookie);
        }
        if (res) {
          ctx.response.status = 200;
          ctx.response.body = res;
          await next();
        }
      },
      async (err) => {
        console.error(err);
        ctx.response.status = 500;
        await next();
      },
    );
  }
});
export default router;
