import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  DeletedAt,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from "sequelize-typescript";
import { Usuario } from "../users/usuario.model";
import { ContaModulo } from "../permissions/conta-modulo.model";

@Table({
  tableName: "CONTA",
  timestamps: true,
  paranoid: true,
  indexes: [{ unique: true, fields: ["email"] }],
})
export class Conta extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id_conta: number;

  @ForeignKey(() => Usuario)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare usuario_id: number;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare email: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare senha_hash: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare ativo: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  declare ultimo_login: Date | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare senha_alterada_em: Date | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt: Date | null;

  @BelongsTo(() => Usuario, { foreignKey: "usuario_id", as: "usuario" })
  declare usuario?: Usuario;

  @HasMany(() => ContaModulo, { foreignKey: "conta_id", as: "modulos" })
  declare modulos?: ContaModulo[];
}
