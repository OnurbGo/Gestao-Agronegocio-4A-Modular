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
import { TIPOS_MOVIMENTACAO, TipoMovimentacao } from "../enums/silo.enums";
import { ContaProduto } from "./conta-produto.entity";
import { Contrato } from "./contrato.entity";
import { Deposito } from "./deposito.entity";
import { Item } from "./item.entity";
import { LoteOperacional } from "./lote-operacional.entity";
import { Pesagem } from "./pesagem.entity";

@Table({
  tableName: "MOVIMENTACAO_PRODUTO",
  timestamps: false,
  indexes: [{ unique: true, fields: ["pesagem_id"] }],
})
export class MovimentacaoProduto extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id_movimentacao_produto: number;

  @ForeignKey(() => Pesagem)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare pesagem_id: number;

  @ForeignKey(() => LoteOperacional)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare lote_operacional_id: number;

  @ForeignKey(() => ContaProduto)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare conta_produto_id: number;

  @ForeignKey(() => Item)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare item_id: number;

  @ForeignKey(() => Deposito)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare deposito_id: number;

  @ForeignKey(() => Contrato)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare contrato_id: number | null;

  @Column({ type: DataType.ENUM(...TIPOS_MOVIMENTACAO), allowNull: false })
  declare tipo_movimentacao: TipoMovimentacao;

  @Column({ type: DataType.DECIMAL(15, 3), allowNull: false })
  declare quantidade_kg: string;

  @Column({ type: DataType.DECIMAL(15, 3), allowNull: false })
  declare quantidade_sacas: string;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  declare data_movimentacao: Date;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare criado_por: number | null;

  @BelongsTo(() => Pesagem, { foreignKey: "pesagem_id", as: "pesagem" })
  declare pesagem?: Pesagem;

  @BelongsTo(() => LoteOperacional, {
    foreignKey: "lote_operacional_id",
    as: "lote_operacional",
  })
  declare lote_operacional?: LoteOperacional;

  @BelongsTo(() => ContaProduto, {
    foreignKey: "conta_produto_id",
    as: "conta_produto",
  })
  declare conta_produto?: ContaProduto;

  @BelongsTo(() => Item, { foreignKey: "item_id", as: "item" })
  declare item?: Item;

  @BelongsTo(() => Deposito, { foreignKey: "deposito_id", as: "deposito" })
  declare deposito?: Deposito;

  @BelongsTo(() => Contrato, { foreignKey: "contrato_id", as: "contrato" })
  declare contrato?: Contrato;
}
