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
import { Entidade } from "../../entidades/entities/entidade.entity";

@Table({
  tableName: "FOLHA_MENSAL",
  timestamps: true,
  indexes: [{ unique: true, fields: ["entidade_id", "ano", "mes"] }],
})
export class FolhaMensal extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id_folha_mensal: number;

  @ForeignKey(() => Entidade)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare entidade_id: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare ano: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare mes: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare dias_trabalhados: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  declare salario_bruto: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  declare inss: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  declare irrf: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  declare inss_adicional: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  declare ferias: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare ferias_automatica: boolean;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  declare comissao: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  declare salario_liquido: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  declare desconto_bar: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  declare desconto_diverso_1: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  declare desconto_diverso_2: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  declare desconto_diverso_3: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  declare salario_liquido_com_desconto: string;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @BelongsTo(() => Entidade, { foreignKey: "entidade_id", as: "entidade" })
  declare entidade?: Entidade;
}

