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
import { Conta } from "../accounts/conta.model";
import { MODULOS, Modulo } from "./modulo.enum";

@Table({
  tableName: "CONTA_MODULO",
  timestamps: false,
  indexes: [{ unique: true, fields: ["conta_id", "modulo"] }],
})
export class ContaModulo extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id_conta_modulo: number;

  @ForeignKey(() => Conta)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare conta_id: number;

  @Column({ type: DataType.ENUM(...MODULOS), allowNull: false })
  declare modulo: Modulo;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare pode_visualizar: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare pode_criar: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare pode_editar: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare pode_excluir: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare pode_restaurar: boolean;

  @BelongsTo(() => Conta, { foreignKey: "conta_id", as: "conta" })
  declare conta?: Conta;
}
