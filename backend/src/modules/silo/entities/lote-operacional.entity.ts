import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from "sequelize-typescript";
import {
  LOTE_OPERACIONAL_STATUS,
  LOTE_OPERACIONAL_TIPOS,
  LoteOperacionalStatus,
  LoteOperacionalTipo,
} from "../enums/silo.enums";
import { ContaProduto } from "./conta-produto.entity";
import { Contrato } from "./contrato.entity";
import { Destino } from "./destino.entity";
import { Item } from "./item.entity";
import { Pesagem } from "./pesagem.entity";

@Table({
  tableName: "LOTE_OPERACIONAL",
  timestamps: true,
})
export class LoteOperacional extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id_lote_operacional: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare nome: string;

  @Column({ type: DataType.ENUM(...LOTE_OPERACIONAL_TIPOS), allowNull: false })
  declare tipo: LoteOperacionalTipo;

  @Column({
    type: DataType.ENUM(...LOTE_OPERACIONAL_STATUS),
    allowNull: false,
    defaultValue: "ABERTO",
  })
  declare status: LoteOperacionalStatus;

  @ForeignKey(() => ContaProduto)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare conta_produto_id: number;

  @ForeignKey(() => Item)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare item_id: number;

  @ForeignKey(() => Contrato)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare contrato_id: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare imovel_id_ref: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare area_lote_id_ref: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare safra_id_ref: number | null;

  @ForeignKey(() => Destino)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare destino_id: number | null;

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

  @BelongsTo(() => Contrato, { foreignKey: "contrato_id", as: "contrato" })
  declare contrato?: Contrato;

  @BelongsTo(() => Destino, { foreignKey: "destino_id", as: "destino" })
  declare destino?: Destino;

  @HasMany(() => Pesagem, {
    foreignKey: "lote_operacional_id",
    as: "pesagens",
  })
  declare pesagens?: Pesagem[];
}
