import { Model, DataTypes } from "sequelize";
import sequelize from "../../config/database";

class Usuario extends Model {
  id_usuario: number | undefined;
  nome: string | undefined;
  email: string | undefined;
  senha_hash: string | undefined;
  ativo: boolean | undefined;
  ultimo_login?: Date | null | undefined;
  observacao?: string | undefined;
  deletedAt?: Date | null | undefined;
}

Usuario.init(
  {
    id_usuario: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    nome: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    senha_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    ultimo_login: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    observacao: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "USUARIO",
    timestamps: true,
    paranoid: true,
  },
);

export default Usuario;
