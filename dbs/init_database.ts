import { db } from "./index.ts";

db.sync({
  drop: true,
});
