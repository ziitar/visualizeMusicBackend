import { Model } from "../utils/models/util.ts";

const Song = new Model("song", [
  "id",
  "type",
  "url",
  "title",
  "duration",
  "track_no",
  "lossless",
  "sample_rate",
  "start",
  "bitrate",
  "album_id",
]);

export default Song;
