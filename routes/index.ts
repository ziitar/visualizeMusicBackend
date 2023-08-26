import {
  Router,
  RouterMiddleware,
} from "https://deno.land/x/oak@v12.2.0/mod.ts";
import NEMRoutes from "./neteaseMusic/neteaseMusicRoutes.ts";
import UserRoutes from "./user/index.ts";
import SheetsRoutes from "./sheets/index.ts";
import SongRoutes from "./songs/index.ts";
import AssetsRoutes from "./assets.ts";
import { Session } from "https://deno.land/x/oak_sessions@v4.1.3/mod.ts";
import { isTrulyValue, setResponseBody } from "../utils/util.ts";

const author: RouterMiddleware<
  string,
  Record<string, any>,
  { session: Session }
> = async (ctx, next) => {
  const userId = await ctx.state.session?.get("userId") as number;
  if (isTrulyValue(userId)) {
    await next();
  } else {
    setResponseBody(ctx, 401, undefined, "获取不到用户信息，请登录");
  }
};

const router = new Router();
router.use("/cloudApi", NEMRoutes.routes());
router.use("/user", UserRoutes.routes());
router.use("/sheets", author, SheetsRoutes.routes());
router.use("/songs", SongRoutes.routes());
router.use("/assets", async (ctx, next) => {
  const maxAge = 3600 * 24 * 7;
  ctx.response.headers.set("Cache-Control", `max-age=${maxAge}`);
  await next();
}, AssetsRoutes.routes());
export default router;
