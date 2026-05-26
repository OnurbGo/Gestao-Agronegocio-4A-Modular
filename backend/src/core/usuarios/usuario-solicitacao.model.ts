import { Model, DataTypes } from "sequelize";
import sequelize from "../../config/database";
import { PermissaoModulo } from "../permissoes/modulo.enum";

class UsuarioSolicitacao extends Model {
  id_usuario_solicitacao: number | undefined;
  nome: string | undefined;
  email: string | undefined;
  senha_hash: string | undefined;
  observacao?: string | null | undefined;
  modulos_solicitados?: PermissaoModulo[] | null | undefined;
  status: "PENDENTE" | "APROVADA" | "RECUSADA" | undefined;
  aprovado_por_usuario_id?: number | null | undefined;
  aprovado_em?: Date | null | undefined;
  recusado_por_usuario_id?: number | null | undefined;
  recusado_em?: Date | null | undefined;
  motivo_recusa?: string | null | undefined;
}

UsuarioSolicitacao.init(
  {
    id_usuario_solicitacao: {
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
    },

    senha_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    observacao: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    modulos_solicitados: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("PENDENTE", "APROVADA", "RECUSADA"),
      allowNull: false,
      defaultValue: "PENDENTE",
    },

    aprovado_por_usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    aprovado_em: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    recusado_por_usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    recusado_em: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    motivo_recusa: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "USUARIO_SOLICITACAO",
    timestamps: true,
    indexes: [
      {
        fields: ["email", "status"],
      },
    ],
  },
);

export default UsuarioSolicitacao;
