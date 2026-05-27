import { DataTypes, Model } from "sequelize";
import sequelize from "../../../config/database";
import Entidade from "../../escritorio/entidades/entidade.model";

class RegistroSalarial extends Model {
  id_registro_salarial: number | undefined;
  entidade_id: number | undefined;
  inicio_vigencia: Date | undefined;
  salario: string | undefined;
  percentual?: string | null | undefined;
  observacao?: string | null | undefined;
}

RegistroSalarial.init(
  {
    id_registro_salarial: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    entidade_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    inicio_vigencia: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    salario: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    percentual: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
    },

    observacao: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "REGISTRO_SALARIAL",
    timestamps: true,
    updatedAt: false,
  },
);

Entidade.hasMany(RegistroSalarial, {
  foreignKey: "entidade_id",
  as: "registros_salariais",
});

RegistroSalarial.belongsTo(Entidade, {
  foreignKey: "entidade_id",
  as: "entidade",
});

export default RegistroSalarial;
