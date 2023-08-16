import { Model } from "../utils/models/util.ts";

const SongArtist = new Model("song_artist", [
  "artist_id",
  "song_id",
]);

export default SongArtist;
