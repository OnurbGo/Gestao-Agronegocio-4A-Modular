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
import { TabelaDesconto } from "./tabela-desconto.entity";

@Table({
  tableName: "ITEM",
  timestamps: true,
  paranoid: true,
})
export class Item extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id_item: number;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare nome: string;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: "KG" })
  declare unidade_medida: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare controla_estoque: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare exige_classificacao: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare ativo: boolean;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt: Date | null;

  @HasMany(() => TabelaDesconto, {
    foreignKey: "item_id",
    as: "tabelas_desconto",
  })
  declare tabelas_desconto?: TabelaDesconto[];
}
