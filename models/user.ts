import { DataTypes, Model } from "https://deno.land/x/denodb@v1.4.0/mod.ts";

class User extends Model {
  static table = "user";

  static timestamps = true;

  static fields = {
    id: {
      type: DataTypes.INTEGER,
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
