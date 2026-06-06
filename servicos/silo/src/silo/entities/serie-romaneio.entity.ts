import {
  AutoIncrement,
  Column,
  DataType,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { Pesagem } from "./pesagem.entity";

@Table({
  tableName: "SERIE_ROMANEIO",
  timestamps: false,
})
export class SerieRomaneio extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id_serie_romaneio: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare numero_serie: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
  declare proximo_numero: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare ativa: boolean;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  declare iniciada_em: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  declare encerrada_em: Date | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare criada_por: number | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare motivo_abertura: string | null;

  @HasMany(() => Pesagem, {
    foreignKey: "serie_romaneio_id",
    as: "pesagens",
  })
  declare pesagens?: Pesagem[];
}
