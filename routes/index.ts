import { Router } from "https://deno.land/x/oak@v10.2.1/mod.ts";
import NEMRoutes from "./neteaseMusic/neteaseMusicRoutes.ts";
import UserRoutes from "./user/index.ts";

const router = new Router();
router.use("/cloudApi", NEMRoutes.routes());
router.use("/user", UserRoutes.routes());
export default router;
