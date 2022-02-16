import db from "./connect.ts";
import User from "../models/user.ts";

db.link([
  User,
]);
db.sync();

export { User };
