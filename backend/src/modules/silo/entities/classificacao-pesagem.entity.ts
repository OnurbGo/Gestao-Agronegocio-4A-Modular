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
import { Pesagem } from "./pesagem.entity";
import { TabelaDesconto } from "./tabela-desconto.entity";

@Table({
  tableName: "CLASSIFICACAO_PESAGEM",
  timestamps: false,
  indexes: [{ unique: true, fields: ["pesagem_id"] }],
})
export class ClassificacaoPesagem extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id_classificacao_pesagem: number;

  @ForeignKey(() => Pesagem)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare pesagem_id: number;

  @ForeignKey(() => TabelaDesconto)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare tabela_desconto_id: number;

  @Column({ type: DataType.DECIMAL(10, 4), allowNull: false })
  declare umidade_percentual: string;

  @Column({ type: DataType.DECIMAL(10, 4), allowNull: false })
  declare impureza_percentual: string;

  @Column({ type: DataType.DECIMAL(10, 4), allowNull: false })
  declare desconto_umidade_percentual: string;

  @Column({ type: DataType.DECIMAL(10, 4), allowNull: false })
  declare desconto_impureza_percentual: string;

  @Column({ type: DataType.DECIMAL(15, 3), allowNull: false })
  declare desconto_umidade_kg: string;

  @Column({ type: DataType.DECIMAL(15, 3), allowNull: false })
  declare desconto_impureza_kg: string;

  @Column({ type: DataType.DECIMAL(15, 3), allowNull: false })
  declare peso_final_kg: string;

  @Column({ type: DataType.DECIMAL(15, 3), allowNull: false })
  declare sacas_final: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare classificado_por: number | null;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  declare classificado_em: Date;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare atualizado_por: number | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare atualizado_em: Date | null;

  @BelongsTo(() => Pesagem, { foreignKey: "pesagem_id", as: "pesagem" })
  declare pesagem?: Pesagem;

  @BelongsTo(() => TabelaDesconto, {
    foreignKey: "tabela_desconto_id",
    as: "tabela_desconto",
  })
  declare tabela_desconto?: TabelaDesconto;
}
