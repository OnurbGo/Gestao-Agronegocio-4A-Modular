import { Model, DataTypes } from "sequelize";
import sequelize from "../../../config/database";

import Entidade from "./entidade.model";
import TipoDocumento from "./tipo_documento.model";

class EntidadeArquivo extends Model {
  id_entidade_arquivo: number | undefined;
  entidade_id: number | undefined;
  tipo_documento_id: number | undefined;
  nome_original: string | undefined;
  nome_arquivo: string | undefined;
  caminho: string | undefined;
  tipo_mime: string | undefined;
  tamanho: number | undefined;
  observacao?: string | undefined;
  enviado_por_usuario_id?: number | undefined;
  ativo: boolean | undefined;
  deletedAt?: Date | null | undefined;
}

EntidadeArquivo.init(
  {
    id_entidade_arquivo: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    entidade_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    tipo_documento_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    nome_original: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    nome_arquivo: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    caminho: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    tipo_mime: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    tamanho: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    observacao: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    enviado_por_usuario_id: {
      type: DataTypes.INTEGER,
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
    tableName: "ENTIDADE_ARQUIVO",
    timestamps: true,
    paranoid: true,
  },
);

Entidade.hasMany(EntidadeArquivo, {
  foreignKey: "entidade_id",
  as: "arquivos",
});

EntidadeArquivo.belongsTo(Entidade, {
  foreignKey: "entidade_id",
  as: "entidade",
});

TipoDocumento.hasMany(EntidadeArquivo, {
  foreignKey: "tipo_documento_id",
  as: "arquivos",
});

EntidadeArquivo.belongsTo(TipoDocumento, {
  foreignKey: "tipo_documento_id",
  as: "tipoDocumento",
});

export default EntidadeArquivo;
