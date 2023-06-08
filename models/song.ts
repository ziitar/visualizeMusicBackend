import { DataTypes, Model } from "https://deno.land/x/denodb@v1.4.0/mod.ts";

class Song extends Model {
  static table = "song";

  static timestamps = true;

  static fields = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    songName: DataTypes.STRING,
    url: DataTypes.STRING,
    authors: {
      type: DataTypes.STRING,
    },
    headerImg: DataTypes.STRING,
    duration: DataTypes.BIG_INTEGER,
  };
}

export default Song;
