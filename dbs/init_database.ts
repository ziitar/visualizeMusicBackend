import { randomPassword } from "../utils/util.ts";
import { db, User } from "./index.ts";
import { Md5 } from "https://deno.land/std@0.119.0/hash/md5.ts";
await db.sync({
  drop: true,
});

const password = randomPassword(8);
const md5 = new Md5();
await User.create({
  username: "admin",
  password: md5.update(password).toString(),
});

console.log(password);

await db.close();

Deno.exit();
