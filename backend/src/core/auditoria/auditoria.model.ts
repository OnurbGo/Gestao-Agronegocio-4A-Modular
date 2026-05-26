import { Model, DataTypes } from "sequelize";
import sequelize from "../../config/database";

class Auditoria extends Model {
  id_auditoria: number | undefined;
  usuario_id?: number | null | undefined;
  acao: string | undefined;
  recurso: string | undefined;
  recurso_id?: number | null | undefined;
  valor_anterior?: object | null | undefined;
  valor_novo?: object | null | undefined;
  ip?: string | null | undefined;
  data_hora: Date | undefined;
}

Auditoria.init(
  {
    id_auditoria: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    acao: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    recurso: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    recurso_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    valor_anterior: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    valor_novo: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    ip: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    data_hora: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "AUDITORIA",
    timestamps: false,
  },
);

export default Auditoria;
