import { Model } from "../utils/models/util.ts";

const AlbumArtist = new Model("ablum_artist", [
  "artist_id",
  "album_id",
]);
export default AlbumArtist;
