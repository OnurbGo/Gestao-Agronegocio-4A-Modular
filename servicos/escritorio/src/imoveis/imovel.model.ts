import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  DeletedAt,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from "sequelize-typescript";
import { Entidade } from "../entidades/entidade.model";
import { Contrato } from "../contratos/contrato.model";
import { ImovelArquivo } from "./imovel-arquivo.model";

@Table({
  tableName: "IMOVEL",
  timestamps: true,
  paranoid: true,
})
export class Imovel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id_imovel: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare nome: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare codigo: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare matricula: string | null;

  @ForeignKey(() => Entidade)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare proprietario_entidade_id: number | null;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  declare area_total: string | null;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  declare area_agricultavel: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare cep: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare logradouro: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare numero: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare bairro: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare cidade: string | null;

  @Column({ type: DataType.STRING(2), allowNull: true })
  declare estado: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare complemento: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare observacao: string | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare ativo: boolean;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt: Date | null;

  @BelongsTo(() => Entidade, {
    foreignKey: "proprietario_entidade_id",
    as: "proprietario",
  })
  declare proprietario?: Entidade;

  @HasMany(() => ImovelArquivo, { foreignKey: "imovel_id", as: "arquivos" })
  declare arquivos?: ImovelArquivo[];

  @HasMany(() => Contrato, { foreignKey: "imovel_id", as: "contratos" })
  declare contratos?: Contrato[];
}
