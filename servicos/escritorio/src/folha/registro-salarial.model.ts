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
  tableName: "REGISTRO_SALARIAL",
  timestamps: true,
  updatedAt: false,
})
export class RegistroSalarial extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id_registro_salarial: number;

  @ForeignKey(() => Entidade)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare entidade_id: number;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare inicio_vigencia: Date;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  declare salario: string;

  @Column({ type: DataType.DECIMAL(6, 2), allowNull: true })
  declare percentual: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare observacao: string | null;

  @CreatedAt
  declare createdAt: Date;

  @BelongsTo(() => Entidade, { foreignKey: "entidade_id", as: "entidade" })
  declare entidade?: Entidade;
}
