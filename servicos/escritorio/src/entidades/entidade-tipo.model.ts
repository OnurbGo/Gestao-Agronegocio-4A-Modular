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
import { Entidade } from "./entidade.model";

@Table({
  tableName: "ENTIDADE_TIPO",
  timestamps: false,
  indexes: [{ unique: true, fields: ["entidade_id", "tipo"] }],
})
export class EntidadeTipo extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id_entidade_tipo: number;

  @ForeignKey(() => Entidade)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare entidade_id: number;

  @Column({
    type: DataType.ENUM("FUNCIONARIO", "PROPRIETARIO", "CLIENTE", "ARRENDATARIO"),
    allowNull: false,
  })
  declare tipo: "FUNCIONARIO" | "PROPRIETARIO" | "CLIENTE" | "ARRENDATARIO";

  @BelongsTo(() => Entidade, { foreignKey: "entidade_id", as: "entidade" })
  declare entidade?: Entidade;
}
