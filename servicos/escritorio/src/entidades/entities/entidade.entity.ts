import {
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  DeletedAt,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from "sequelize-typescript";
import { EntidadeTipo } from "./entidade-tipo.entity";
import { EntidadeArquivo } from "./entidade-arquivo.entity";
import { RegistroSalarial } from "../../folha/entities/registro-salarial.entity";
import { Ferias } from "../../folha/entities/ferias.entity";
import { FolhaMensal } from "../../folha/entities/folha-mensal.entity";

@Table({
  tableName: "ENTIDADE",
  timestamps: true,
  paranoid: true,
})
export class Entidade extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id_entidade: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare nome: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare cpf_cnpj: string;

  @Column({ type: DataType.ENUM("FISICA", "JURIDICA"), allowNull: false })
  declare tipo_pessoa: "FISICA" | "JURIDICA";

  @Column({ type: DataType.STRING, allowNull: true })
  declare email: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare telefone: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare celular: string | null;

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

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare data_nascimento: Date | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare nacionalidade: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare filiacao: string | null;

  @Column({
    type: DataType.ENUM("SOLTEIRO", "CASADO", "DIVORCIADO", "VIUVO", "UNIAO_ESTAVEL"),
    allowNull: true,
  })
  declare estado_civil: string | null;

  @Column({
    type: DataType.ENUM("MASCULINO", "FEMININO", "OUTRO", "NAO_INFORMADO"),
    allowNull: true,
  })
  declare genero: string | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare participa_folha: boolean;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare data_admissao: Date | null;

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

  @HasMany(() => EntidadeTipo, { foreignKey: "entidade_id", as: "tipos" })
  declare tipos?: EntidadeTipo[];

  @HasMany(() => EntidadeArquivo, { foreignKey: "entidade_id", as: "arquivos" })
  declare arquivos?: EntidadeArquivo[];

  @HasMany(() => RegistroSalarial, {
    foreignKey: "entidade_id",
    as: "registros_salariais",
  })
  declare registros_salariais?: RegistroSalarial[];

  @HasMany(() => Ferias, { foreignKey: "entidade_id", as: "ferias" })
  declare ferias?: Ferias[];

  @HasMany(() => FolhaMensal, { foreignKey: "entidade_id", as: "folhas_mensais" })
  declare folhas_mensais?: FolhaMensal[];
}

