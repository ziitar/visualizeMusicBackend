import { db } from "./index.ts";

await db.sync({
  drop: true,
});

await db.close();

Deno.exit();
