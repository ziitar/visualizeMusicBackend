import { Sheet } from "../../dbs/index.ts";
import { helpers, Router } from "https://deno.land/x/oak@v10.2.1/mod.ts";
import { isTrulyArg, isTrulyValue } from "../../utils/util.ts";
import { Session } from "https://deno.land/x/oak_sessions@v3.2.5/mod.ts";

const router = new Router<{ session: Session }>();

router.post("/create", async (ctx, next) => {
  const { name, url } = await ctx.request.body({ type: "json" }).value;
  if (isTrulyValue(name)) {
    const userId = await ctx.state.session?.get("userId") as number;
    if (userId) {
      const userSheets = await Sheet.where({ userId, sheetName: name }).get();
      if (!userSheets || !userSheets.length) {
        try {
          await Sheet.create({
            sheetName: name,
            url,
            userId: userId,
          });
          ctx.response.status = 200;
          ctx.response.body = {
            code: 200,
            result: true,
            msg: "创建成功",
          };
        } catch (e) {
          ctx.response.status = 500;
          ctx.response.body = {
            code: 500,
            result: false,
            msg: e.message,
          };
        }
      } else {
        ctx.response.status = 200;
        ctx.response.body = {
          code: -1,
          result: false,
          msg: "名称重复",
        };
      }
    } else {
      ctx.response.status = 200;
      ctx.response.body = {
        code: 401,
        msg: "获取不到用户信息，请登录",
      };
    }
  } else {
    ctx.response.status = 400;
    await next();
  }
});

export default router;
