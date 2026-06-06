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
import { LoteOperacional } from "./lote-operacional.entity";
import { Pesagem } from "./pesagem.entity";

@Table({
  tableName: "DADOS_SAIDA_PESAGEM",
  timestamps: true,
  indexes: [{ unique: true, fields: ["pesagem_id"] }],
})
export class DadosSaidaPesagem extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id_dados_saida_pesagem: number;

  @ForeignKey(() => Pesagem)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare pesagem_id: number;

  @ForeignKey(() => LoteOperacional)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare lote_operacional_id: number;

  @Column({ type: DataType.STRING, allowNull: true })
  declare numero_nota_fiscal: string | null;

  @Column({ type: DataType.DECIMAL(15, 3), allowNull: true })
  declare peso_nf_kg: string | null;

  @Column({ type: DataType.DECIMAL(15, 3), allowNull: true })
  declare peso_nf_sacas: string | null;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: true })
  declare valor_total: string | null;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: true })
  declare senar_valor: string | null;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: true })
  declare funrural_valor: string | null;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: true })
  declare icms_valor: string | null;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: true })
  declare frete_valor: string | null;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: true })
  declare corretagem_valor: string | null;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: true })
  declare royalties_valor: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare cad_pro: string | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare imovel_emissor_id_ref: number | null;

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

  @BelongsTo(() => Pesagem, { foreignKey: "pesagem_id", as: "pesagem" })
  declare pesagem?: Pesagem;

  @BelongsTo(() => LoteOperacional, {
    foreignKey: "lote_operacional_id",
    as: "lote_operacional",
  })
  declare lote_operacional?: LoteOperacional;
}
