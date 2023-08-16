import { randomPassword } from "../utils/util.ts";
import { db } from "./index.ts";
import { Md5 } from "https://deno.land/std@0.119.0/hash/md5.ts";

const [row1, fields1] = await db.query(`drop table if EXISTS user`);
if (row1) {
  console.error(row1);
}
const [row2, fields2] = await db.query(`
  create table user
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
if (row2) {
  console.error(row2);
}
console.log(fields2);
const md5 = new Md5();
const password = randomPassword(8);
const [row3, fields3] = await db.query(
  `insert into user values (1, 'admin', '${
    md5.update(password).toString()
  }', null, null)`,
);
if (row3) {
  console.error(row3);
}
console.log(fields3);
db.end();
