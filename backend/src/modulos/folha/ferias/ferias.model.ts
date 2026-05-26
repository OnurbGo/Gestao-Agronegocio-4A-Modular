import { DataTypes, Model } from "sequelize";
import sequelize from "../../../config/database";
import Entidade from "../../escritorio/entidades/entidade.model";

class Ferias extends Model {
  id_ferias: number | undefined;
  entidade_id: number | undefined;
  periodo_aquisitivo_inicio: Date | undefined;
  periodo_aquisitivo_fim: Date | undefined;
  dias_totais: number | undefined;
  dias_gozados: number | undefined;
  valor_abono?: string | null | undefined;
  periodo_inicio?: Date | null | undefined;
  periodo_fim?: Date | null | undefined;
  data_retorno?: Date | null | undefined;
}

Ferias.init(
  {
    id_ferias: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    entidade_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    periodo_aquisitivo_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    periodo_aquisitivo_fim: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    dias_totais: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    dias_gozados: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    valor_abono: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },

    periodo_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    periodo_fim: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    data_retorno: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "FERIAS",
    timestamps: true,
    updatedAt: false,
  },
);

Entidade.hasMany(Ferias, {
  foreignKey: "entidade_id",
  as: "ferias",
});

Ferias.belongsTo(Entidade, {
  foreignKey: "entidade_id",
  as: "entidade",
});

export default Ferias;
