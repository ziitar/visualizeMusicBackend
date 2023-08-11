import { DataTypes, Model } from "https://deno.land/x/denodb@v1.4.0/mod.ts";

class Sheet extends Model {
  static table = "sheet";

  static timestamps = true;

  static fields = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    sheetName: DataTypes.STRING,
    url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  };
}

export default Sheet;
