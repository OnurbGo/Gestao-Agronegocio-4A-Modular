import {
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  DeletedAt,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from "sequelize-typescript";

@Table({
  tableName: "TRANSPORTADORA",
  timestamps: true,
  paranoid: true,
})
export class Transportadora extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id_transportadora: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare nome: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare entidade_id_ref: number | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare documento: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare telefone: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare observacao: string | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare ativa: boolean;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt: Date | null;
}
