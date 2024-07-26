import { createPool } from "npm:mysql2@3.6.0/promise";

import connectInfo from "../config/connect.json" with { type: "json" };

const db = await createPool({
  host: connectInfo.host,
  port: connectInfo.port,
  user: connectInfo.user,
  password: connectInfo.password,
  database: connectInfo.dataBase,
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
