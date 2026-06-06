import {
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { ContaProduto } from "./conta-produto.entity";
import { Item } from "./item.entity";

@Table({
  tableName: "SALDO_CONTA_PRODUTO",
  timestamps: false,
  indexes: [{ unique: true, fields: ["conta_produto_id", "item_id"] }],
})
export class SaldoContaProduto extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id_saldo_conta_produto: number;

  @ForeignKey(() => ContaProduto)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare conta_produto_id: number;

  @ForeignKey(() => Item)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare item_id: number;

  @Column({ type: DataType.DECIMAL(15, 3), allowNull: false, defaultValue: 0 })
  declare saldo_kg: string;

  @Column({ type: DataType.DECIMAL(15, 3), allowNull: false, defaultValue: 0 })
  declare saldo_sacas: string;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  declare atualizado_em: Date;

  @BelongsTo(() => ContaProduto, {
    foreignKey: "conta_produto_id",
    as: "conta_produto",
  })
  declare conta_produto?: ContaProduto;

  @BelongsTo(() => Item, { foreignKey: "item_id", as: "item" })
  declare item?: Item;
}
