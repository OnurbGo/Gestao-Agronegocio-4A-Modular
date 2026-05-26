import { Model, DataTypes } from "sequelize";
import sequelize from "../../config/database";
import Usuario from "./usuario.model";

class UsuarioModulo extends Model {
  id_usuario_modulo: number | undefined;

  usuario_id: number | undefined;

  modulo:
    | "ADMIN"
    | "GERENTE"
    | "ESCRITORIO"
    | "FOLHA"
    | "BALANCA"
    | "SILO"
    | "BARRACAO"
    | "LAVOURA"
    | "ALMOXARIFADO"
    | "FINANCEIRO"
    | undefined;

  pode_visualizar: boolean | undefined;
  pode_criar: boolean | undefined;
  pode_editar: boolean | undefined;
  pode_excluir: boolean | undefined;
  pode_restaurar: boolean | undefined;
}

UsuarioModulo.init(
  {
    id_usuario_modulo: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    modulo: {
      type: DataTypes.ENUM(
        "ADMIN",
        "GERENTE",
        "ESCRITORIO",
        "FOLHA",
        "BALANCA",
        "SILO",
        "BARRACAO",
        "LAVOURA",
        "ALMOXARIFADO",
        "FINANCEIRO",
      ),
      allowNull: false,
    },

    pode_visualizar: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    pode_criar: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    pode_editar: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    pode_excluir: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    pode_restaurar: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: "USUARIO_MODULO",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["usuario_id", "modulo"],
      },
    ],
  },
);

Usuario.hasMany(UsuarioModulo, {
  foreignKey: "usuario_id",
  as: "modulos",
});

UsuarioModulo.belongsTo(Usuario, {
  foreignKey: "usuario_id",
  as: "usuario",
});

export default UsuarioModulo;
