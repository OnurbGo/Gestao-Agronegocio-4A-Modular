import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from "sequelize-typescript";
import { CONTRATO_STATUS, ContratoStatus } from "../enums/silo.enums";
import { ContaProduto } from "./conta-produto.entity";
import { Item } from "./item.entity";

@Table({
  tableName: "CONTRATO_SILO",
  timestamps: true,
  indexes: [{ unique: true, fields: ["numero_contrato"] }],
})
export class Contrato extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id_contrato: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare numero_contrato: string;

  @ForeignKey(() => ContaProduto)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare conta_produto_id: number;

  @ForeignKey(() => Item)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare item_id: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare comprador_entidade_id_ref: number | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare comprador_nome_cache: string | null;

  @Column({ type: DataType.DECIMAL(15, 3), allowNull: false })
  declare quantidade_contratada_kg: string;

  @Column({ type: DataType.DECIMAL(15, 3), allowNull: false, defaultValue: 0 })
  declare quantidade_entregue_kg: string;

  @Column({ type: DataType.DECIMAL(15, 3), allowNull: false, defaultValue: 0 })
  declare saldo_kg: string;

  @Column({
    type: DataType.ENUM(...CONTRATO_STATUS),
    allowNull: false,
    defaultValue: "ABERTO",
  })
  declare status: ContratoStatus;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare data_contrato: string | null;

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

  @BelongsTo(() => ContaProduto, {
    foreignKey: "conta_produto_id",
    as: "conta_produto",
  })
  declare conta_produto?: ContaProduto;

  @BelongsTo(() => Item, { foreignKey: "item_id", as: "item" })
  declare item?: Item;
}
