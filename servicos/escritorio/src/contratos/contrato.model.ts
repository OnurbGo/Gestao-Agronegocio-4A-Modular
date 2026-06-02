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
import { Entidade } from "../entidades/entidade.model";
import { Imovel } from "../imoveis/imovel.model";

@Table({
  tableName: "CONTRATO",
  timestamps: true,
  paranoid: true,
  indexes: [{ unique: true, fields: ["numero"] }],
})
export class Contrato extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id_contrato: number;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare numero: string;

  @ForeignKey(() => Entidade)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare entidade_id: number;

  @ForeignKey(() => Imovel)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare imovel_id: number | null;

  @Column({ type: DataType.STRING, allowNull: false })
  declare safra: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare produto: string;

  @Column({ type: DataType.DECIMAL(14, 2), allowNull: false, defaultValue: 0 })
  declare quantidade_prevista: string;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: "KG" })
  declare unidade: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare data_inicial: Date;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare data_final: Date;

  @Column({
    type: DataType.ENUM("RASCUNHO", "ATIVO", "ENCERRADO", "CANCELADO"),
    allowNull: false,
    defaultValue: "RASCUNHO",
  })
  declare status: "RASCUNHO" | "ATIVO" | "ENCERRADO" | "CANCELADO";

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

  @BelongsTo(() => Entidade, { foreignKey: "entidade_id", as: "entidade" })
  declare entidade?: Entidade;

  @BelongsTo(() => Imovel, { foreignKey: "imovel_id", as: "imovel" })
  declare imovel?: Imovel;
}
