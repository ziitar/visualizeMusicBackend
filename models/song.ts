import { DataTypes, Model } from "https://deno.land/x/denodb@v1.4.0/mod.ts";

class Song extends Model {
  static table = "song";

  static timestamps = true;

  static fields = {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    title: DataTypes.STRING,
    url: DataTypes.STRING,
    artist: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    album: DataTypes.STRING,
    albumartist: DataTypes.STRING,
    year: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    picUrl: DataTypes.STRING,
    duration: DataTypes.STRING,
    type: DataTypes.enum(["single", "tracks"]),
  };
}

export default Song;
