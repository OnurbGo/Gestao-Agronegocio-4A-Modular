import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Op, Transaction } from "sequelize";
import { AuditService } from "../auditoria/services/audit.service";
import { AuthContext } from "../auth-client/types/auth.types";
import {
  AcaoLoteDto,
  AtualizarLoteOperacionalInput,
  ListarLotesOperacionaisQuery,
  LoteOperacionalInput,
} from "../dto/lotes-operacionais.dto";
import { ContaProduto } from "../entities/conta-produto.entity";
import { Contrato } from "../entities/contrato.entity";
import { Destino } from "../entities/destino.entity";
import { Item } from "../entities/item.entity";
import { LoteOperacional } from "../entities/lote-operacional.entity";
import { Pesagem } from "../entities/pesagem.entity";
import { SiloRepository } from "../repositories/silo.repository";
import {
  getPagination,
  toPaginatedResponse,
} from "../../shared/utils/pagination";
import { CadastrosService } from "./cadastros.service";

const LOTE_INCLUDES = [
  { model: ContaProduto, as: "conta_produto" },
  { model: Item, as: "item" },
  { model: Contrato, as: "contrato" },
  { model: Destino, as: "destino" },
];

@Injectable()
export class LotesOperacionaisService {
  constructor(
    private readonly siloRepository: SiloRepository,
    private readonly cadastrosService: CadastrosService,
    private readonly auditService: AuditService,
  ) {}

  async listar(query: ListarLotesOperacionaisQuery) {
    const { page, limit, offset } = getPagination(query);
    const where: Record<string, unknown> = {};

    if (query.search) {
      where[Op.or as unknown as string] = [
        { nome: { [Op.like]: `%${query.search}%` } },
        { observacao: { [Op.like]: `%${query.search}%` } },
      ];
    }

    if (query.tipo) where.tipo = query.tipo;
    if (query.status) where.status = query.status;
    if (query.conta_produto_id) where.conta_produto_id = query.conta_produto_id;
    if (query.item_id) where.item_id = query.item_id;

    const { rows, count } = await this.siloRepository.listarLotes({
      where,
      include: LOTE_INCLUDES,
      distinct: true,
      limit,
      offset,
      order: [["id_lote_operacional", "DESC"]],
    });

    return toPaginatedResponse(rows, count, page, limit);
  }

  async criar(
    data: LoteOperacionalInput,
    usuario: AuthContext,
    ip?: string,
  ) {
    const transaction = await this.siloRepository.criarTransacao();
    let lote: LoteOperacional;

    try {
      await this.validarReferenciasLote(data, transaction);
      lote = await this.siloRepository.criarLote(
        {
          ...data,
          status: "ABERTO",
          criado_por: usuario.usuario_id,
          atualizado_por: usuario.usuario_id,
        },
        transaction,
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    const criado = await this.buscarPorId(lote!.id_lote_operacional);
    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "LOTE_OPERACIONAL_CRIADO",
      recurso: "LOTE_OPERACIONAL",
      recurso_id: lote!.id_lote_operacional,
      valor_novo: this.toPlain(criado),
      ip,
    });

    return criado;
  }

  async buscarPorId(id: number, transaction?: Transaction) {
    const lote = await this.siloRepository.buscarLote(id, {
      include: [
        ...LOTE_INCLUDES,
        { model: Pesagem, as: "pesagens", required: false },
      ],
      transaction,
    });

    if (!lote) {
      throw new NotFoundException("Lote operacional nao encontrado.");
    }

    return lote;
  }

  async atualizar(
    id: number,
    data: AtualizarLoteOperacionalInput,
    usuario: AuthContext,
    ip?: string,
  ) {
    const lote = await this.buscarLoteEditavel(id);
    const anterior = this.toPlain(await this.buscarPorId(id));
    const transaction = await this.siloRepository.criarTransacao();

    try {
      await this.validarReferenciasLote(data, transaction);
      await lote.update(
        { ...data, atualizado_por: usuario.usuario_id },
        { transaction },
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    const atualizado = await this.buscarPorId(id);
    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "LOTE_OPERACIONAL_ATUALIZADO",
      recurso: "LOTE_OPERACIONAL",
      recurso_id: id,
      valor_anterior: anterior,
      valor_novo: this.toPlain(atualizado),
      ip,
    });

    return atualizado;
  }

  async fechar(id: number, data: AcaoLoteDto, usuario: AuthContext, ip?: string) {
    const lote = await this.buscarLoteEditavel(id);
    const anterior = this.toPlain(await this.buscarPorId(id));
    await lote.update({
      status: "FECHADO",
      atualizado_por: usuario.usuario_id,
    });

    const atualizado = await this.buscarPorId(id);
    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "LOTE_OPERACIONAL_FECHADO",
      recurso: "LOTE_OPERACIONAL",
      recurso_id: id,
      valor_anterior: anterior,
      valor_novo: this.toPlain(atualizado),
      justificativa: data.justificativa || null,
      ip,
    });

    return atualizado;
  }

  async reabrir(
    id: number,
    data: AcaoLoteDto,
    usuario: AuthContext,
    ip?: string,
  ) {
    const lote = await this.buscarPorId(id);

    if (lote.status !== "FECHADO") {
      throw new BadRequestException("Apenas lotes fechados podem ser reabertos.");
    }

    const anterior = this.toPlain(lote);
    await lote.update({
      status: "EM_ANDAMENTO",
      atualizado_por: usuario.usuario_id,
    });

    const atualizado = await this.buscarPorId(id);
    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "LOTE_OPERACIONAL_REABERTO",
      recurso: "LOTE_OPERACIONAL",
      recurso_id: id,
      valor_anterior: anterior,
      valor_novo: this.toPlain(atualizado),
      justificativa: data.justificativa || null,
      ip,
    });

    return atualizado;
  }

  async cancelar(
    id: number,
    data: AcaoLoteDto,
    usuario: AuthContext,
    ip?: string,
  ) {
    const lote = await this.buscarPorId(id);

    if (lote.status === "CANCELADO") {
      throw new BadRequestException("Lote operacional ja esta cancelado.");
    }

    const anterior = this.toPlain(lote);
    await lote.update({
      status: "CANCELADO",
      atualizado_por: usuario.usuario_id,
    });

    const atualizado = await this.buscarPorId(id);
    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "LOTE_OPERACIONAL_CANCELADO",
      recurso: "LOTE_OPERACIONAL",
      recurso_id: id,
      valor_anterior: anterior,
      valor_novo: this.toPlain(atualizado),
      justificativa: data.justificativa || null,
      ip,
    });

    return atualizado;
  }

  private async buscarLoteEditavel(id: number) {
    const lote = await this.siloRepository.buscarLote(id);

    if (!lote) {
      throw new NotFoundException("Lote operacional nao encontrado.");
    }

    if (["FECHADO", "CANCELADO"].includes(lote.status)) {
      throw new BadRequestException(
        "Lote operacional fechado ou cancelado nao pode ser editado.",
      );
    }

    return lote;
  }

  private async validarReferenciasLote(
    data: Partial<LoteOperacionalInput | AtualizarLoteOperacionalInput>,
    transaction?: Transaction,
  ) {
    await this.cadastrosService.validarReferenciasBasicas(
      {
        conta_produto_id: data.conta_produto_id,
        item_id: data.item_id,
        destino_id: data.destino_id,
      },
      transaction,
    );

    if (data.contrato_id) {
      const contrato = await this.siloRepository.buscarContrato(data.contrato_id, {
        transaction,
      });

      if (!contrato) {
        throw new NotFoundException("Contrato nao encontrado.");
      }
    }
  }

  private toPlain(entity: { get: (options: { plain: true }) => object }) {
    return entity.get({ plain: true });
  }
}
