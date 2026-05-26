import { Model, DataTypes } from "sequelize";
import sequelize from "../../../config/database";
import Entidade from "./entidade.model";

class EntidadeTipo extends Model {
  id_entidade_tipo: number | undefined;
  entidade_id: number | undefined;
  tipo: "FUNCIONARIO" | "PROPRIETARIO" | "CLIENTE" | "ARRENDATARIO" | undefined;
}

EntidadeTipo.init(
  {
    id_entidade_tipo: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    entidade_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    tipo: {
      type: DataTypes.ENUM(
        "FUNCIONARIO",
        "PROPRIETARIO",
        "CLIENTE",
        "ARRENDATARIO",
      ),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "ENTIDADE_TIPO",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["entidade_id", "tipo"],
      },
    ],
  },
);

Entidade.hasMany(EntidadeTipo, {
  foreignKey: "entidade_id",
  as: "tipos",
});

EntidadeTipo.belongsTo(Entidade, {
  foreignKey: "entidade_id",
  as: "entidade",
});

export default EntidadeTipo;
