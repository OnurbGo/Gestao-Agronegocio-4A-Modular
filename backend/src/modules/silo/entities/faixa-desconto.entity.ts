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
import { TIPOS_DESCONTO, TipoDesconto } from "../enums/silo.enums";
import { TabelaDesconto } from "./tabela-desconto.entity";

@Table({
  tableName: "FAIXA_DESCONTO",
  timestamps: false,
})
export class FaixaDesconto extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id_faixa_desconto: number;

  @ForeignKey(() => TabelaDesconto)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare tabela_desconto_id: number;

  @Column({ type: DataType.ENUM(...TIPOS_DESCONTO), allowNull: false })
  declare tipo: TipoDesconto;

  @Column({ type: DataType.DECIMAL(10, 4), allowNull: false })
  declare valor_inicial: string;

  @Column({ type: DataType.DECIMAL(10, 4), allowNull: false })
  declare valor_final: string;

  @Column({ type: DataType.DECIMAL(10, 4), allowNull: false })
  declare percentual_desconto: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare ativa: boolean;

  @BelongsTo(() => TabelaDesconto, {
    foreignKey: "tabela_desconto_id",
    as: "tabela_desconto",
  })
  declare tabela_desconto?: TabelaDesconto;
}
