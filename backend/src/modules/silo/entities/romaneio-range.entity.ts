import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from "sequelize-typescript";
import {
  ROMANEIO_RANGE_STATUS,
  RomaneioRangeStatus,
} from "../enums/silo.enums";
import { Pesagem } from "./pesagem.entity";
import { SerieRomaneio } from "./serie-romaneio.entity";

@Table({
  tableName: "ROMANEIO_RANGE",
  timestamps: true,
  createdAt: "criado_em",
  updatedAt: "atualizado_em",
  indexes: [
    { fields: ["balanca_client_id", "status"] },
    { unique: true, fields: ["serie_romaneio_id", "numero_inicial"] },
    { unique: true, fields: ["serie_romaneio_id", "numero_final"] },
  ],
})
export class RomaneioRange extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id_romaneio_range: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare balanca_client_id: string;

  @ForeignKey(() => SerieRomaneio)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare serie_romaneio_id: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare numero_inicial: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare numero_final: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare proximo_numero: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare quantidade_reservada: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare quantidade_usada: number;

  @Column({
    type: DataType.ENUM(...ROMANEIO_RANGE_STATUS),
    allowNull: false,
    defaultValue: "ATIVA",
  })
  declare status: RomaneioRangeStatus;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare reservado_por: number | null;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  declare reservado_em: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  declare expira_em: Date | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare observacao: string | null;

  @CreatedAt
  declare criado_em: Date;

  @UpdatedAt
  declare atualizado_em: Date;

  @BelongsTo(() => SerieRomaneio, {
    foreignKey: "serie_romaneio_id",
    as: "serie_romaneio",
  })
  declare serie_romaneio?: SerieRomaneio;

  @HasMany(() => Pesagem, {
    foreignKey: "romaneio_range_id",
    as: "pesagens",
  })
  declare pesagens?: Pesagem[];
}
