import { Model } from "../utils/models/util.ts";

const Artist = new Model("artist", [
  "id",
  "name",
]);

export default Artist;
