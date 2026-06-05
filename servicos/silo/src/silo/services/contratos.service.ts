import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Op, Transaction } from "sequelize";
import { AuditService } from "../../audit/services/audit.service";
import { AuthContext } from "../../auth-client/types/auth.types";
import {
  AtualizarContratoInput,
  CancelarContratoDto,
  ContratoInput,
  ListarContratosQuery,
} from "../dto/contratos.dto";
import { ContaProduto } from "../entities/conta-produto.entity";
import { Contrato } from "../entities/contrato.entity";
import { Item } from "../entities/item.entity";
import { ContratoStatus } from "../enums/silo.enums";
import { decimal, numero } from "../helpers/number.utils";
import { SiloRepository } from "../repositories/silo.repository";
import {
  getPagination,
  toPaginatedResponse,
} from "../../shared/utils/pagination";
import { CadastrosService } from "./cadastros.service";

const CONTRATO_INCLUDES = [
  { model: ContaProduto, as: "conta_produto" },
  { model: Item, as: "item" },
];

@Injectable()
export class ContratosService {
  constructor(
    private readonly siloRepository: SiloRepository,
    private readonly cadastrosService: CadastrosService,
    private readonly auditService: AuditService,
  ) {}

  async listar(query: ListarContratosQuery) {
    const { page, limit, offset } = getPagination(query);
    const where: Record<string, unknown> = {};

    if (query.search) {
      where[Op.or as unknown as string] = [
        { numero_contrato: { [Op.like]: `%${query.search}%` } },
        { comprador_nome_cache: { [Op.like]: `%${query.search}%` } },
      ];
    }

    if (query.conta_produto_id) where.conta_produto_id = query.conta_produto_id;
    if (query.item_id) where.item_id = query.item_id;
    if (query.status) where.status = query.status;

    const { rows, count } = await this.siloRepository.listarContratos({
      where,
      include: CONTRATO_INCLUDES,
      distinct: true,
      limit,
      offset,
      order: [["id_contrato", "DESC"]],
    });

    return toPaginatedResponse(rows, count, page, limit);
  }

  async criar(data: ContratoInput, usuario: AuthContext, ip?: string) {
    const transaction = await this.siloRepository.criarTransacao();
    let contrato: Contrato;

    try {
      await this.cadastrosService.validarReferenciasBasicas(
        {
          conta_produto_id: data.conta_produto_id,
          item_id: data.item_id,
        },
        transaction,
      );
      contrato = await this.siloRepository.criarContrato(
        {
          ...data,
          quantidade_contratada_kg: decimal(data.quantidade_contratada_kg),
          quantidade_entregue_kg: decimal(0),
          saldo_kg: decimal(data.quantidade_contratada_kg),
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

    const criado = await this.buscarPorId(contrato!.id_contrato);
    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "CONTRATO_CRIADO",
      recurso: "CONTRATO_SILO",
      recurso_id: contrato!.id_contrato,
      valor_novo: this.toPlain(criado),
      ip,
    });
    return criado;
  }

  async buscarPorId(id: number, transaction?: Transaction) {
    const contrato = await this.siloRepository.buscarContrato(id, {
      include: CONTRATO_INCLUDES,
      transaction,
    });

    if (!contrato) {
      throw new NotFoundException("Contrato nao encontrado.");
    }

    return contrato;
  }

  async atualizar(
    id: number,
    data: AtualizarContratoInput,
    usuario: AuthContext,
    ip?: string,
  ) {
    const contrato = await this.buscarPorId(id);
    const anterior = this.toPlain(contrato);
    const transaction = await this.siloRepository.criarTransacao();

    try {
      await this.cadastrosService.validarReferenciasBasicas(
        {
          conta_produto_id: data.conta_produto_id,
          item_id: data.item_id,
        },
        transaction,
      );

      const proximaQuantidade =
        data.quantidade_contratada_kg === undefined
          ? numero(contrato.quantidade_contratada_kg)
          : data.quantidade_contratada_kg;
      const entregue = numero(contrato.quantidade_entregue_kg);
      const saldo = proximaQuantidade - entregue;
      const status = data.status || this.statusPorSaldo(proximaQuantidade, entregue);

      await contrato.update(
        {
          ...data,
          quantidade_contratada_kg:
            data.quantidade_contratada_kg === undefined
              ? undefined
              : decimal(data.quantidade_contratada_kg),
          saldo_kg: decimal(saldo),
          status,
          atualizado_por: usuario.usuario_id,
        },
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
      acao: "CONTRATO_ATUALIZADO",
      recurso: "CONTRATO_SILO",
      recurso_id: id,
      valor_anterior: anterior,
      valor_novo: this.toPlain(atualizado),
      ip,
    });
    return atualizado;
  }

  async cancelar(
    id: number,
    data: CancelarContratoDto,
    usuario: AuthContext,
    ip?: string,
  ) {
    const contrato = await this.buscarPorId(id);
    const anterior = this.toPlain(contrato);
    await contrato.update({
      status: "CANCELADO",
      atualizado_por: usuario.usuario_id,
    });

    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "CONTRATO_CANCELADO",
      recurso: "CONTRATO_SILO",
      recurso_id: id,
      valor_anterior: anterior,
      valor_novo: this.toPlain(contrato),
      justificativa: data.justificativa,
      ip,
    });
    return contrato;
  }

  async registrarEntrega(
    contratoId: number,
    quantidadeKg: number,
    usuarioId: number,
    transaction: Transaction,
  ) {
    const contrato = await this.buscarPorId(contratoId, transaction);

    if (contrato.status === "CANCELADO") {
      throw new BadRequestException("Contrato cancelado nao pode receber entrega.");
    }

    const contratado = numero(contrato.quantidade_contratada_kg);
    const entregue = numero(contrato.quantidade_entregue_kg) + quantidadeKg;
    const saldo = contratado - entregue;

    await contrato.update(
      {
        quantidade_entregue_kg: decimal(entregue),
        saldo_kg: decimal(saldo),
        status: this.statusPorSaldo(contratado, entregue),
        atualizado_por: usuarioId,
      },
      { transaction },
    );

    return contrato;
  }

  private statusPorSaldo(contratado: number, entregue: number): ContratoStatus {
    if (entregue <= 0) return "ABERTO";
    if (entregue >= contratado) return "CONCLUIDO";
    return "PARCIAL";
  }

  private toPlain(entity: { get: (options: { plain: true }) => object }) {
    return entity.get({ plain: true });
  }
}
