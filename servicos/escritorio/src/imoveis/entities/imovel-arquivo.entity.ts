import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  DeletedAt,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from "sequelize-typescript";
import { TipoDocumento } from "../../entidades/entities/tipo-documento.entity";
import { Imovel } from "./imovel.entity";

@Table({
  tableName: "IMOVEL_ARQUIVO",
  timestamps: true,
  paranoid: true,
})
export class ImovelArquivo extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id_imovel_arquivo: number;

  @ForeignKey(() => Imovel)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare imovel_id: number;

  @ForeignKey(() => TipoDocumento)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare tipo_documento_id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare nome_original: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare nome_arquivo: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare caminho: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare tipo_mime: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare tamanho: number;

  @Column({ type: DataType.STRING, allowNull: true })
  declare observacao: string | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare enviado_por_usuario_id: number | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare ativo: boolean;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt: Date | null;

  @BelongsTo(() => Imovel, { foreignKey: "imovel_id", as: "imovel" })
  declare imovel?: Imovel;

  @BelongsTo(() => TipoDocumento, {
    foreignKey: "tipo_documento_id",
    as: "tipoDocumento",
  })
  declare tipoDocumento?: TipoDocumento;
}

