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
    type: DataTypes.enum(["single", "tracks"]),
    url: DataTypes.STRING,
    title: DataTypes.STRING,
    duration: DataTypes.STRING,
    trackNo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lossless: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    sampleRate: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    start: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    bitrate: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  };
}

export default Song;
