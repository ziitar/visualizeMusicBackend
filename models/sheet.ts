import { Model } from "../utils/models/util.ts";

const Sheet = new Model("sheet", [
  "id",
  "sheet_name",
  "url",
  "user_id",
]);
export default Sheet;
