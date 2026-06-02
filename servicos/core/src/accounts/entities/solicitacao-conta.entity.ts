import {
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from "sequelize-typescript";

@Table({
  tableName: "SOLICITACAO_CONTA",
  timestamps: true,
})
export class SolicitacaoConta extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id_solicitacao_conta: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare nome: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare email: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare imagem_perfil_url: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare observacao: string | null;

  @Column({ type: DataType.STRING, allowNull: false })
  declare senha_hash: string;

  @Column({ type: DataType.JSON, allowNull: true })
  declare modulos_solicitados: object | null;

  @Column({
    type: DataType.ENUM("PENDENTE", "APROVADA", "RECUSADA"),
    allowNull: false,
    defaultValue: "PENDENTE",
  })
  declare status: "PENDENTE" | "APROVADA" | "RECUSADA";

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare aprovado_por_usuario_id: number | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare aprovado_em: Date | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare recusado_por_usuario_id: number | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare recusado_em: Date | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare motivo_recusa: string | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}

