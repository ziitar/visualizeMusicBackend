import { Model } from "../utils/models/util.ts";

const User = new Model("user", [
  "id",
  "username",
  "password",
  "email",
  "head_url",
]);

export default User;
