import mysql from "npm:mysql2@3.6.0/promise";

import connectInfo from "../config/connect.json" assert { type: "json" };

const pool = await mysql.createConnection({
  host: connectInfo.host,
  port: connectInfo.port,
  user: connectInfo.user,
  password: connectInfo.password,
  database: connectInfo.dataBase,
});

export default pool;
