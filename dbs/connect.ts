import {
  Database,
  MySQLConnector,
} from "https://deno.land/x/denodb@v1.4.0/mod.ts";

import connectInfo from "../connect.json" assert { type: "json" };

const connection = new MySQLConnector({
  host: connectInfo.host,
  port: connectInfo.port,
  username: connectInfo.user,
  password: connectInfo.password,
  database: connectInfo.dataBase,
});

const db = new Database(connection);

export default db;
