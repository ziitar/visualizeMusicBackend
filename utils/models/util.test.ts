import { ResultSetHeader } from "npm:mysql2@3.6.0/promise";
import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { db } from "../../dbs/index.ts";
import { Model } from "./util.ts";

const Test = new Model("test", [
  "id",
  "username",
  "password",
  "email",
  "head_url",
]);

Deno.test("test dataBase", async (t) => {
  await t.step({
    name: "test db table create",
    ignore: false,
    fn: async () => {
      const [table, fields] = await db.query<ResultSetHeader>(`
      create table ${Test.table}
      (
        id int not null primary key  AUTO_INCREMENT, 
        username varchar(255) not null,
        password varchar(255) not null, 
        email varchar(255) ,
        head_url varchar(255), 
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP,
        unique key (id)
      )
    `);
      console.log("table result", table);
      console.log("fields result", fields);
      assertExists(table);
    },
  });
  let createId = 1;
  await t.step({
    name: "test db create",
    ignore: false,
    fn: async () => {
      const [test, fields] = await Test.create({
        username: "ziitar",
        password: "1234565",
        headUrl: "http://localhost:7000",
      });
      console.log("table result", test);
      console.log("fields result", fields);
      createId = test.insertId;
      assertEquals(test.affectedRows, 1);
    },
  });
  await t.step({
    name: "test db query",
    ignore: false,
    fn: async () => {
      const [test, fields] = await Test.query(
        {
          username: "ziitar",
          password: "1234565",
        },
        undefined,
        Test.fields,
      );
      console.log("table result", test);
      console.log("fields result", fields);
      assertEquals(test.length, 1);
    },
  });
  await t.step({
    name: "test db update",
    ignore: false,
    fn: async () => {
      const [test, fields] = await Test.update(
        { username: "为你我受冷风吹" },
        { id: createId },
      );
      console.log("table result", test);
      console.log("fields result", fields);
      assertEquals(test.affectedRows, 1);
    },
  });
  await t.step({
    name: "test db delete",
    ignore: false,
    fn: async () => {
      const [test, fields] = await Test.deleteFn({
        username: "为你我受冷风吹",
      });
      console.log("table result", test);
      console.log("fields result", fields);
      assertEquals(test.affectedRows, 1);
    },
  });
  await t.step({
    name: "test table delete",
    ignore: false,
    fn: async () => {
      const [test, fields] = await db.query(
        `drop table if EXISTS ${Test.table}`,
      );
      console.log("table result", test);
      console.log("fields result", fields);
      assertExists(test);
    },
  });
  await db.end();
});
