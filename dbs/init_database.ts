import { randomPassword } from "../utils/util.ts";
import { db, User } from "./index.ts";
import { Md5 } from "https://deno.land/std@0.119.0/hash/md5.ts";

await db.query(`drop table if EXISTS song_sheet`);
await db.query(`drop table if EXISTS song_artist`);
await db.query(`drop table if EXISTS song`);
await db.query(`drop table if EXISTS album_artist`);
await db.query(`drop table if EXISTS album`);
await db.query(`drop table if EXISTS artist`);
await db.query(`drop table if EXISTS sheet`);
await db.query(`drop table if EXISTS user`);

await db.query(`
  create table user
  (
    id int not null primary key  AUTO_INCREMENT, 
    username varchar(255) not null,
    password varchar(255) not null, 
    email varchar(255) ,
    head_url varchar(255), 
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    updated_at datetime DEFAULT CURRENT_TIMESTAMP
  )
`);

await db.query(`
  create table sheet
  (
    id int not null primary key  AUTO_INCREMENT, 
    sheet_name varchar(255) not null,
    url varchar(255) ,
    user_id int not null,
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    updated_at datetime DEFAULT CURRENT_TIMESTAMP,
    constraint SHEET_USER_ID_FK foreign key (user_id) references user(id) 
  )
`);

await db.query(`
  create table artist
  (
    id int not null primary key  AUTO_INCREMENT, 
    name varchar(255) not null,
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    updated_at datetime DEFAULT CURRENT_TIMESTAMP
  )
`);

await db.query(`
  create table album
  (
    id int not null primary key  AUTO_INCREMENT,
    name varchar(255) not null,
    image varchar(255),
    track_total int,
    disk_total int,
    disk_no int,
    year int,
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    updated_at datetime DEFAULT CURRENT_TIMESTAMP
  )
`);

await db.query(`
  create table album_artist
  (
    id int not null primary key  AUTO_INCREMENT, 
    album_id int not null,
    artist_id int not null,
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    updated_at datetime DEFAULT CURRENT_TIMESTAMP,
    constraint ALBUM_ARTIST_ALBUM_ID_FK foreign key (album_id) references album(id),
    constraint ALBUM_ARTIST_ARTIST_ID_FK foreign key (artist_id) references artist(id)
  )
`);

await db.query(`
  create table song
  (
    id int not null primary key  AUTO_INCREMENT,
    type ENUM('single', 'tracks') not null,
    url varchar(255) not null,
    title varchar(255) not null,
    duration varchar(255),
    track_no int,
    lossless tinyint(1),
    sample_rate int,
    start float(8,2),
    bitrate int,
    album_id int not null,
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    updated_at datetime DEFAULT CURRENT_TIMESTAMP,
    constraint SONG_ALBUM_ID_FK foreign key (album_id) references album(id)
  )
`);
await db.query(`
  create table song_artist
  (
    id int not null primary key  AUTO_INCREMENT, 
    song_id int not null,
    artist_id int not null,
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    updated_at datetime DEFAULT CURRENT_TIMESTAMP,
    constraint SONG_ARTIST_SONG_ID_FK foreign key (song_id) references song(id),
    constraint SONG_ARTIST_ARTIST_ID_FK foreign key (artist_id) references artist(id)
  )
`);

await db.query(`
  create table song_sheet
  (
    id int not null primary key  AUTO_INCREMENT, 
    song_id int not null,
    sheet_id int not null,
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    updated_at datetime DEFAULT CURRENT_TIMESTAMP,
    constraint SONG_SHEET_SONG_ID_FK foreign key (song_id) references song(id),
    constraint SONG_SHEET_SHEET_ID_FK foreign key (sheet_id) references sheet(id)
  )
`);
const md5 = new Md5();
const password = randomPassword(8);
const [row] = await User.create({
  username: "admin",
  password: md5.update(password).toString(),
});
if (row.affectedRows) {
  console.log("生成admin账户密码", password);
}

db.end();
