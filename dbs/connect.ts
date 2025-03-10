import { createPool } from "npm:mysql2@3.6.0/promise";
import { readConfig } from "../utils/readConfig.ts";

const password = await readConfig(Deno.env.get("MYSQL_PASSWORD_PATH"));

const db = await createPool({
  host: Deno.env.get("MYSQL_HOST"),
  port: Number(Deno.env.get("MYSQL_PORT")),
  user: Deno.env.get("MYSQL_USER"),
  password: password,
  database: Deno.env.get("MYSQL_DATABASE"),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});
db.on("connection", () => {
  console.log("conn connention");
});
db.on("release", (conn) => {
  console.log("conn release");
});
export default db;
