import { AutoIncrement, Column, DataType, HasMany, Model, PrimaryKey, Table } from "sequelize-typescript";
import { EntidadeArquivo } from "./entidade-arquivo.model";

@Table({
  tableName: "TIPO_DOCUMENTO",
  timestamps: false,
})
export class TipoDocumento extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id_tipo_documento: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare nome: string;

  @Column({
    type: DataType.ENUM("PESSOAL", "EMPRESARIAL", "RURAL", "CONTRATUAL", "OUTROS"),
    allowNull: false,
    defaultValue: "OUTROS",
  })
  declare categoria: string;

  @Column({
    type: DataType.ENUM("FISICA", "JURIDICA", "AMBAS"),
    allowNull: false,
    defaultValue: "AMBAS",
  })
  declare tipo_pessoa_aplicavel: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare obrigatorio: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare ativo: boolean;

  @HasMany(() => EntidadeArquivo, {
    foreignKey: "tipo_documento_id",
    as: "arquivos",
  })
  declare arquivos?: EntidadeArquivo[];
}
