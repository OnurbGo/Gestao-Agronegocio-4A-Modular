import { Model, DataTypes } from "sequelize";
import sequelize from "../../../config/database";

class TipoDocumento extends Model {
  id_tipo_documento: number | undefined;

  nome: string | undefined;

  categoria:
    | "PESSOAL"
    | "EMPRESARIAL"
    | "RURAL"
    | "CONTRATUAL"
    | "OUTROS"
    | undefined;

  tipo_pessoa_aplicavel: "FISICA" | "JURIDICA" | "AMBAS" | undefined;

  obrigatorio: boolean | undefined;

  ativo: boolean | undefined;
}

TipoDocumento.init(
  {
    id_tipo_documento: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    nome: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    categoria: {
      type: DataTypes.ENUM(
        "PESSOAL",
        "EMPRESARIAL",
        "RURAL",
        "CONTRATUAL",
        "OUTROS",
      ),
      allowNull: false,
      defaultValue: "OUTROS",
    },

    tipo_pessoa_aplicavel: {
      type: DataTypes.ENUM("FISICA", "JURIDICA", "AMBAS"),
      allowNull: false,
      defaultValue: "AMBAS",
    },

    obrigatorio: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "TIPO_DOCUMENTO",
    timestamps: false,
  },
);

export default TipoDocumento;
