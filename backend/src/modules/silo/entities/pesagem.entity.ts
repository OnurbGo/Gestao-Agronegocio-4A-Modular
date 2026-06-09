import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  HasOne,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from "sequelize-typescript";
import {
  PESAGEM_ORIGENS,
  PESAGEM_STATUS,
  PESAGEM_TIPOS_OPERACAO,
  PesagemOrigem,
  PesagemStatus,
  PesagemTipoOperacao,
} from "../enums/silo.enums";
import { ClassificacaoPesagem } from "./classificacao-pesagem.entity";
import { ContaProduto } from "./conta-produto.entity";
import { Contrato } from "./contrato.entity";
import { Deposito } from "./deposito.entity";
import { Destino } from "./destino.entity";
import { Emissor } from "./emissor.entity";
import { Item } from "./item.entity";
import { LoteOperacional } from "./lote-operacional.entity";
import { RomaneioRange } from "./romaneio-range.entity";
import { SerieRomaneio } from "./serie-romaneio.entity";
import { Transportadora } from "./transportadora.entity";

@Table({
  tableName: "PESAGEM",
  timestamps: true,
  indexes: [
    { unique: true, fields: ["serie_romaneio_id", "numero_romaneio"] },
    { unique: true, fields: ["client_request_id"] },
    { fields: ["romaneio_range_id", "numero_romaneio"] },
  ],
})
export class Pesagem extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id_pesagem: number;

  @ForeignKey(() => LoteOperacional)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare lote_operacional_id: number;

  @ForeignKey(() => SerieRomaneio)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare serie_romaneio_id: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare numero_romaneio: number;

  @Column({ type: DataType.STRING, allowNull: true })
  declare client_request_id: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare balanca_client_id: string | null;

  @Column({
    type: DataType.ENUM(...PESAGEM_ORIGENS),
    allowNull: false,
    defaultValue: "WEB",
  })
  declare origem: PesagemOrigem;

  @ForeignKey(() => RomaneioRange)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare romaneio_range_id: number | null;

  @Column({ type: DataType.ENUM(...PESAGEM_TIPOS_OPERACAO), allowNull: false })
  declare tipo_operacao: PesagemTipoOperacao;

  @Column({
    type: DataType.ENUM(...PESAGEM_STATUS),
    allowNull: false,
    defaultValue: "ABERTA",
  })
  declare status: PesagemStatus;

  @ForeignKey(() => ContaProduto)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare conta_produto_id: number;

  @ForeignKey(() => Item)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare item_id: number;

  @ForeignKey(() => Transportadora)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare transportadora_id: number;

  @ForeignKey(() => Emissor)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare emissor_id: number;

  @ForeignKey(() => Deposito)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare deposito_id: number;

  @ForeignKey(() => Destino)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare destino_id: number;

  @ForeignKey(() => Contrato)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare contrato_id: number | null;

  @Column({ type: DataType.STRING, allowNull: false })
  declare placa: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare motorista_nome: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare observacao: string | null;

  @Column({ type: DataType.DECIMAL(15, 3), allowNull: true })
  declare pesagem_1_kg: string | null;

  @Column({ type: DataType.DECIMAL(15, 3), allowNull: true })
  declare pesagem_2_kg: string | null;

  @Column({ type: DataType.DECIMAL(15, 3), allowNull: true })
  declare peso_liquido_kg: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare data_pesagem_1: Date | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare data_pesagem_2: Date | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare finalizada_em: Date | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare created_at_local: Date | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare criado_por: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare atualizado_por: number | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @BelongsTo(() => LoteOperacional, {
    foreignKey: "lote_operacional_id",
    as: "lote_operacional",
  })
  declare lote_operacional?: LoteOperacional;

  @BelongsTo(() => SerieRomaneio, {
    foreignKey: "serie_romaneio_id",
    as: "serie_romaneio",
  })
  declare serie_romaneio?: SerieRomaneio;

  @BelongsTo(() => RomaneioRange, {
    foreignKey: "romaneio_range_id",
    as: "romaneio_range",
  })
  declare romaneio_range?: RomaneioRange;

  @BelongsTo(() => ContaProduto, {
    foreignKey: "conta_produto_id",
    as: "conta_produto",
  })
  declare conta_produto?: ContaProduto;

  @BelongsTo(() => Item, { foreignKey: "item_id", as: "item" })
  declare item?: Item;

  @BelongsTo(() => Transportadora, {
    foreignKey: "transportadora_id",
    as: "transportadora",
  })
  declare transportadora?: Transportadora;

  @BelongsTo(() => Emissor, { foreignKey: "emissor_id", as: "emissor" })
  declare emissor?: Emissor;

  @BelongsTo(() => Deposito, { foreignKey: "deposito_id", as: "deposito" })
  declare deposito?: Deposito;

  @BelongsTo(() => Destino, { foreignKey: "destino_id", as: "destino" })
  declare destino?: Destino;

  @BelongsTo(() => Contrato, { foreignKey: "contrato_id", as: "contrato" })
  declare contrato?: Contrato;

  @HasOne(() => ClassificacaoPesagem, {
    foreignKey: "pesagem_id",
    as: "classificacao",
  })
  declare classificacao?: ClassificacaoPesagem;
}
