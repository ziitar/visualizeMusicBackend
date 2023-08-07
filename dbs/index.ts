import db from "./connect.ts";
import User from "../models/user.ts";
import Song from "../models/song.ts";
import Sheet from "../models/sheet.ts";
import Album from "../models/album.ts";
import Artist from "../models/artist.ts";
import { Relationships } from "https://deno.land/x/denodb@v1.4.0/mod.ts";

Relationships.belongsTo(Sheet, User);
Relationships.belongsTo(Song, Album);
const SongSheet = Relationships.manyToMany(Song, Sheet);
const SongArtist = Relationships.manyToMany(Song, Artist);
const AlbumArtist = Relationships.manyToMany(Album, Artist);

db.link([
  User,
  Sheet,
  Album,
  Song,
  Artist,
  SongSheet,
  SongArtist,
  AlbumArtist,
]);

export {
  Album,
  AlbumArtist,
  Artist,
  db,
  Sheet,
  Song,
  SongArtist,
  SongSheet,
  User,
};
