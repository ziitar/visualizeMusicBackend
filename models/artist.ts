import { DataTypes, Model } from "https://deno.land/x/denodb@v1.4.0/mod.ts";

class Artist extends Model {
  static table = "artist";

  static timestamps = true;

  static fields = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: DataTypes.STRING,
  };
}

export default Artist;
