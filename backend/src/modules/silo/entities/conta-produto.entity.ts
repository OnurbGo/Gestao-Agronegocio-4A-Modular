import {
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  DeletedAt,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from "sequelize-typescript";
import { LoteOperacional } from "./lote-operacional.entity";
import { Pesagem } from "./pesagem.entity";

@Table({
  tableName: "CONTA_PRODUTO",
  timestamps: true,
  paranoid: true,
})
export class ContaProduto extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id_conta_produto: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare entidade_id_ref: number | null;

  @Column({ type: DataType.STRING, allowNull: false })
  declare nome: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare documento: string | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare ativa: boolean;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare observacao: string | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare criado_por: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare atualizado_por: number | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt: Date | null;

  @HasMany(() => LoteOperacional, {
    foreignKey: "conta_produto_id",
    as: "lotes_operacionais",
  })
  declare lotes_operacionais?: LoteOperacional[];

  @HasMany(() => Pesagem, { foreignKey: "conta_produto_id", as: "pesagens" })
  declare pesagens?: Pesagem[];
}
