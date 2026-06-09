import {
  AutoIncrement,
  BelongsTo,
  BelongsToMany,
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
import { Entidade } from "../../entidades/entities/entidade.entity";
import { ImovelArquivo } from "./imovel-arquivo.entity";
import { ImovelProprietario } from "./imovel-proprietario.entity";

@Table({
  tableName: "IMOVEL",
  timestamps: true,
  paranoid: true,
})
export class Imovel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id_imovel: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare nome: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare codigo: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare matricula: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare lote: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare municipio: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare n_lote: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare gleba: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare colonia: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare nirf: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare incra: string | null;

  @ForeignKey(() => Entidade)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare proprietario_entidade_id: number | null;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  declare area_total: string | null;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  declare area_agricultavel: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare cep: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare logradouro: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare numero: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare bairro: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare cidade: string | null;

  @Column({ type: DataType.STRING(2), allowNull: true })
  declare estado: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare complemento: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare observacao: string | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare ativo: boolean;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt: Date | null;

  @BelongsTo(() => Entidade, {
    foreignKey: "proprietario_entidade_id",
    as: "proprietario",
  })
  declare proprietario?: Entidade;

  @BelongsToMany(() => Entidade, {
    through: () => ImovelProprietario,
    foreignKey: "imovel_id",
    otherKey: "entidade_id",
    as: "proprietarios",
  })
  declare proprietarios?: Entidade[];

  @HasMany(() => ImovelArquivo, { foreignKey: "imovel_id", as: "arquivos" })
  declare arquivos?: ImovelArquivo[];
}

