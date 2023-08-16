import { Model } from "../utils/models/util.ts";

const SongSheet = new Model("song_sheet", [
  "sheet_id",
  "song_id",
]);

export default SongSheet;
