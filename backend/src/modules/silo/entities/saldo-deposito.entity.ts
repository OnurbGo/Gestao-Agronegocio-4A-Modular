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
import { Deposito } from "./deposito.entity";
import { Item } from "./item.entity";

@Table({
  tableName: "SALDO_DEPOSITO",
  timestamps: false,
  indexes: [{ unique: true, fields: ["deposito_id", "item_id"] }],
})
export class SaldoDeposito extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id_saldo_deposito: number;

  @ForeignKey(() => Deposito)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare deposito_id: number;

  @ForeignKey(() => Item)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare item_id: number;

  @Column({ type: DataType.DECIMAL(15, 3), allowNull: false, defaultValue: 0 })
  declare saldo_kg: string;

  @Column({ type: DataType.DECIMAL(15, 3), allowNull: false, defaultValue: 0 })
  declare saldo_sacas: string;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  declare atualizado_em: Date;

  @BelongsTo(() => Deposito, { foreignKey: "deposito_id", as: "deposito" })
  declare deposito?: Deposito;

  @BelongsTo(() => Item, { foreignKey: "item_id", as: "item" })
  declare item?: Item;
}
