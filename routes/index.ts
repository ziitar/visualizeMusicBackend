import { Router } from "https://deno.land/x/oak@v10.2.1/mod.ts";
import NEMRoutes from "./neteaseMusicRoutes.ts";

const router = new Router();
router.use(NEMRoutes.routes());
export default router;
