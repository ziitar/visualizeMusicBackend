import { Model } from "../utils/models/util.ts";

const Artist = new Model("artist", [
  "id",
  "name",
  "alias",
]);

export default Artist;
