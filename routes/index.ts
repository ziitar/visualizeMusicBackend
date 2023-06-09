import { Router } from "https://deno.land/x/oak@v12.2.0/mod.ts";
import NEMRoutes from "./neteaseMusic/neteaseMusicRoutes.ts";
import UserRoutes from "./user/index.ts";
import SheetsRoutes from "./sheets/index.ts";
import SongRoutes from "./songs/index.ts";
import AssetsRoutes from "./assets.ts";

const router = new Router();
router.use("/cloudApi", NEMRoutes.routes());
router.use("/user", UserRoutes.routes());
router.use("/sheets", SheetsRoutes.routes());
router.use("/songs", SongRoutes.routes());
router.use("/assets", async (ctx, next) => {
  const maxAge = 3600 * 24 * 7;
  ctx.response.headers.set("Cache-Control", `max-age=${maxAge}`);
  await next();
}, AssetsRoutes.routes());
export default router;
