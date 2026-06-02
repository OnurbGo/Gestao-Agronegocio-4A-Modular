import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { Entidade } from "../../entidades/entities/entidade.entity";
import { Imovel } from "./imovel.entity";

@Table({ tableName: "IMOVEL_PROPRIETARIO", timestamps: false })
export class ImovelProprietario extends Model {
  @ForeignKey(() => Imovel)
  @Column({ type: DataType.INTEGER, allowNull: false, primaryKey: true })
  declare imovel_id: number;

  @ForeignKey(() => Entidade)
  @Column({ type: DataType.INTEGER, allowNull: false, primaryKey: true })
  declare entidade_id: number;
}
