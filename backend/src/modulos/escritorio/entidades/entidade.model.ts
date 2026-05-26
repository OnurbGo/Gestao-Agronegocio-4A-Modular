import { Model, DataTypes } from "sequelize";
import sequelize from "../../../config/database";

class Entidade extends Model {
  id_entidade: number | undefined;
  nome: string | undefined;
  cpf_cnpj: string | undefined;
  tipo_pessoa: "FISICA" | "JURIDICA" | undefined;
  email?: string | undefined;
  telefone?: string | undefined;
  celular?: string | undefined;
  cep?: string | undefined;
  logradouro?: string | undefined;
  numero?: string | undefined;
  bairro?: string | undefined;
  cidade?: string | undefined;
  estado?: string | undefined;
  complemento?: string | undefined;
  data_nascimento?: Date | undefined;
  nacionalidade?: string | undefined;
  filiacao?: string | undefined;

  estado_civil?:
    | "SOLTEIRO"
    | "CASADO"
    | "DIVORCIADO"
    | "VIUVO"
    | "UNIAO_ESTAVEL"
    | undefined;

  genero?: "MASCULINO" | "FEMININO" | "OUTRO" | "NAO_INFORMADO";

  participa_folha: boolean | undefined;
  observacao?: string | undefined;
  ativo: boolean | undefined;
  deletedAt?: Date | null | undefined;
}

Entidade.init(
  {
    id_entidade: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    nome: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    cpf_cnpj: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    tipo_pessoa: {
      type: DataTypes.ENUM("FISICA", "JURIDICA"),
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    telefone: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    celular: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    cep: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    logradouro: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    numero: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    bairro: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    cidade: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    estado: {
      type: DataTypes.STRING(2),
      allowNull: true,
    },

    complemento: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    data_nascimento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    nacionalidade: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    filiacao: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    estado_civil: {
      type: DataTypes.ENUM(
        "SOLTEIRO",
        "CASADO",
        "DIVORCIADO",
        "VIUVO",
        "UNIAO_ESTAVEL",
      ),
      allowNull: true,
    },

    genero: {
      type: DataTypes.ENUM("MASCULINO", "FEMININO", "OUTRO", "NAO_INFORMADO"),
      allowNull: true,
    },

    participa_folha: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    observacao: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "ENTIDADE",
    timestamps: true,
    paranoid: true,
  },
);

export default Entidade;
