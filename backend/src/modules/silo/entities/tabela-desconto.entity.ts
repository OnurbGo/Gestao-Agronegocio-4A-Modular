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
import { FaixaDesconto } from "./faixa-desconto.entity";
import { Item } from "./item.entity";

@Table({
  tableName: "TABELA_DESCONTO",
  timestamps: true,
})
export class TabelaDesconto extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id_tabela_desconto: number;

  @ForeignKey(() => Item)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare item_id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare nome: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare ativa: boolean;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare vigencia_inicio: string | null;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare vigencia_fim: string | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare criado_por: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare atualizado_por: number | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @BelongsTo(() => Item, { foreignKey: "item_id", as: "item" })
  declare item?: Item;

  @HasMany(() => FaixaDesconto, {
    foreignKey: "tabela_desconto_id",
    as: "faixas",
  })
  declare faixas?: FaixaDesconto[];
}
