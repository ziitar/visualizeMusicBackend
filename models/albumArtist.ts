import { Model } from "../utils/models/util.ts";

const AlbumArtist = new Model("album_artist", [
  "artist_id",
  "album_id",
]);
export default AlbumArtist;
