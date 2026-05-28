import {
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  DeletedAt,
  HasOne,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from "sequelize-typescript";
import { Conta } from "../accounts/conta.model";

@Table({
  tableName: "USUARIO",
  timestamps: true,
  paranoid: true,
})
export class Usuario extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id_usuario: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare nome: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare imagem_perfil_url: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare observacao: string | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt: Date | null;

  @HasOne(() => Conta, { foreignKey: "usuario_id", as: "conta" })
  declare conta?: Conta;
}
