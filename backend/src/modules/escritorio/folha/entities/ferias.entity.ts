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
import { Entidade } from "../../entidades/entities/entidade.entity";

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
  declare inicio_gozado: Date;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare fim_gozado: Date;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare dias_gozados: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  declare valor_ferias: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true, defaultValue: 0 })
  declare valor_abono: string | null;

  @CreatedAt
  declare createdAt: Date;

  @BelongsTo(() => Entidade, { foreignKey: "entidade_id", as: "entidade" })
  declare entidade?: Entidade;
}

