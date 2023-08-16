import mysql from "npm:mysql2@3.6.0/promise";

import connectInfo from "../config/connect.json" assert { type: "json" };

const pool = await mysql.createPool({
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

export default pool;
