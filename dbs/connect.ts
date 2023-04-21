import {
  Database,
  MySQLConnector,
} from "https://deno.land/x/denodb@v1.4.0/mod.ts";

const connection = new MySQLConnector({
  host: "localhost",
  port: 3306,
  username: "root",
  password: new TextDecoder().decode(await Deno.readFile("password")),
  database: "visualize-music",
});

const db = new Database(connection);

export default db;
