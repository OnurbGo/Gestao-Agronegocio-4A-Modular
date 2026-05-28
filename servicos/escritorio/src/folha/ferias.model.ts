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
} from "sequelize-typescript";
import { Entidade } from "../entidades/entidade.model";

@Table({
  tableName: "FERIAS",
  timestamps: true,
  updatedAt: false,
})
export class Ferias extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id_ferias: number;

  @ForeignKey(() => Entidade)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare entidade_id: number;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare periodo_aquisitivo_inicio: Date;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare periodo_aquisitivo_fim: Date;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare dias_totais: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare dias_gozados: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  declare valor_abono: string | null;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare periodo_inicio: Date | null;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare periodo_fim: Date | null;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare data_retorno: Date | null;

  @CreatedAt
  declare createdAt: Date;

  @BelongsTo(() => Entidade, { foreignKey: "entidade_id", as: "entidade" })
  declare entidade?: Entidade;
}
