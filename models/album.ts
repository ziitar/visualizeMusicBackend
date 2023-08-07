import { DataTypes, Model } from "https://deno.land/x/denodb@v1.4.0/mod.ts";

class Album extends Model {
  static table = "album";

  static timestamps = true;

  static fields = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: DataTypes.STRING,
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    trackTotal: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    diskTotal: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    diskNo: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  };
}

export default Album;
