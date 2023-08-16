import { Model } from "../utils/models/util.ts";

const Album = new Model("album", [
  "id",
  "name",
  "image",
  "track_total",
  "disk_total",
  "disk_no",
  "year",
]);

export default Album;
