import {
  AutoIncrement,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";

@Table({
  tableName: "AUDITORIA_ESCRITORIO",
  timestamps: false,
})
export class AuditoriaEscritorio extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id_auditoria_escritorio: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare conta_id: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare usuario_id: number | null;

  @Column({ type: DataType.STRING, allowNull: false })
  declare acao: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare recurso: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare recurso_id: number | null;

  @Column({ type: DataType.JSON, allowNull: true })
  declare valor_anterior: object | null;

  @Column({ type: DataType.JSON, allowNull: true })
  declare valor_novo: object | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare ip: string | null;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  declare data_hora: Date;
}

