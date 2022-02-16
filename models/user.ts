import { DataTypes, Model } from "https://deno.land/x/denodb@v1.0.40/mod.ts";

class User extends Model {
  static table = "user";

  static timestamps = true;

  static fields = {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    username: DataTypes.STRING,
    password: DataTypes.STRING,
    email: DataTypes.STRING,
    headUrl: DataTypes.STRING,
  };
}

export default User;
