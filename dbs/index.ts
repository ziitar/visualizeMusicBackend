import db from "./connect.ts";
import User from "../models/user.ts";
import Song from "../models/song.ts";
import Sheet from "../models/sheet.ts";
import { Relationships } from "https://deno.land/x/denodb@v1.4.0/mod.ts";

Relationships.belongsTo(Sheet, User);
const SongSheet = Relationships.manyToMany(Song, Sheet);

db.link([
  User,
  Sheet,
  Song,
  SongSheet,
]);

export { db, Sheet, Song, SongSheet, User };
