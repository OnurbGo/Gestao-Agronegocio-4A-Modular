import { Injectable } from "@nestjs/common";
import { Op } from "sequelize";
import {
  ListarMovimentacoesQuery,
  ListarSaldosContaQuery,
  ListarSaldosDepositoQuery,
} from "../dto/relatorios.dto";
import { ClassificacaoPesagem } from "../entities/classificacao-pesagem.entity";
import { ContaProduto } from "../entities/conta-produto.entity";
import { Contrato } from "../entities/contrato.entity";
import { Deposito } from "../entities/deposito.entity";
import { Destino } from "../entities/destino.entity";
import { Item } from "../entities/item.entity";
import { LoteOperacional } from "../entities/lote-operacional.entity";
import { Pesagem } from "../entities/pesagem.entity";
import { SiloRepository } from "../repositories/silo.repository";
import {
  getPagination,
  toPaginatedResponse,
} from "../../shared/utils/pagination";
import { LotesOperacionaisService } from "./lotes-operacionais.service";

const MOVIMENTACAO_INCLUDES = [
  { model: Pesagem, as: "pesagem" },
  { model: LoteOperacional, as: "lote_operacional" },
  { model: ContaProduto, as: "conta_produto" },
  { model: Item, as: "item" },
  { model: Deposito, as: "deposito" },
  { model: Contrato, as: "contrato" },
];

const PESAGEM_RELATORIO_INCLUDES = [
  { model: LoteOperacional, as: "lote_operacional" },
  { model: ContaProduto, as: "conta_produto" },
  { model: Item, as: "item" },
  { model: Deposito, as: "deposito" },
  { model: Destino, as: "destino" },
  { model: Contrato, as: "contrato" },
  { model: ClassificacaoPesagem, as: "classificacao" },
];

@Injectable()
export class RelatoriosService {
  constructor(
    private readonly siloRepository: SiloRepository,
    private readonly lotesService: LotesOperacionaisService,
  ) {}

  async listarMovimentacoes(query: ListarMovimentacoesQuery) {
    const { page, limit, offset } = getPagination(query);
    const where: Record<string, unknown> = {};

    if (query.lote_operacional_id) where.lote_operacional_id = query.lote_operacional_id;
    if (query.conta_produto_id) where.conta_produto_id = query.conta_produto_id;
    if (query.item_id) where.item_id = query.item_id;
    if (query.deposito_id) where.deposito_id = query.deposito_id;

    const { rows, count } = await this.siloRepository.listarMovimentacoes({
      where,
      include: MOVIMENTACAO_INCLUDES,
      distinct: true,
      limit,
      offset,
      order: [["data_movimentacao", "DESC"]],
    });

    return toPaginatedResponse(rows, count, page, limit);
  }

  async listarSaldosConta(query: ListarSaldosContaQuery) {
    const { page, limit, offset } = getPagination(query);
    const where: Record<string, unknown> = {};

    if (query.conta_produto_id) where.conta_produto_id = query.conta_produto_id;
    if (query.item_id) where.item_id = query.item_id;

    const { rows, count } = await this.siloRepository.listarSaldosConta({
      where,
      include: [
        { model: ContaProduto, as: "conta_produto" },
        { model: Item, as: "item" },
      ],
      distinct: true,
      limit,
      offset,
      order: [["atualizado_em", "DESC"]],
    });

    return toPaginatedResponse(rows, count, page, limit);
  }

  async listarSaldosDeposito(query: ListarSaldosDepositoQuery) {
    const { page, limit, offset } = getPagination(query);
    const where: Record<string, unknown> = {};

    if (query.deposito_id) where.deposito_id = query.deposito_id;
    if (query.item_id) where.item_id = query.item_id;

    const { rows, count } = await this.siloRepository.listarSaldosDeposito({
      where,
      include: [
        { model: Deposito, as: "deposito" },
        { model: Item, as: "item" },
      ],
      distinct: true,
      limit,
      offset,
      order: [["atualizado_em", "DESC"]],
    });

    return toPaginatedResponse(rows, count, page, limit);
  }

  relatorioEntrada(query: ListarMovimentacoesQuery) {
    return this.relatorioPesagens("ENTRADA", query);
  }

  relatorioSaida(query: ListarMovimentacoesQuery) {
    return this.relatorioPesagens("SAIDA", query);
  }

  async relatorioLoteOperacional(id: number) {
    const lote = await this.lotesService.buscarPorId(id);
    const pesagens = await this.siloRepository.listarPesagens({
      where: { lote_operacional_id: id },
      include: PESAGEM_RELATORIO_INCLUDES,
      order: [["numero_romaneio", "ASC"]],
    });

    return {
      lote,
      pesagens: pesagens.rows,
      total_pesagens: pesagens.count,
    };
  }

  private async relatorioPesagens(
    tipoOperacao: "ENTRADA" | "SAIDA",
    query: ListarMovimentacoesQuery,
  ) {
    const { page, limit, offset } = getPagination(query);
    const where: Record<string, unknown> = {
      tipo_operacao: tipoOperacao,
    };

    if (query.search) {
      where[Op.or as unknown as string] = [
        { placa: { [Op.like]: `%${query.search}%` } },
        { motorista_nome: { [Op.like]: `%${query.search}%` } },
        { numero_romaneio: Number(query.search) || 0 },
      ];
    }

    if (query.lote_operacional_id) where.lote_operacional_id = query.lote_operacional_id;
    if (query.conta_produto_id) where.conta_produto_id = query.conta_produto_id;
    if (query.item_id) where.item_id = query.item_id;
    if (query.deposito_id) where.deposito_id = query.deposito_id;

    const { rows, count } = await this.siloRepository.listarPesagens({
      where,
      include: PESAGEM_RELATORIO_INCLUDES,
      distinct: true,
      limit,
      offset,
      order: [["id_pesagem", "DESC"]],
    });

    return toPaginatedResponse(rows, count, page, limit);
  }
}
