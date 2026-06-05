import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Op, Transaction } from "sequelize";
import { AuditService } from "../../audit/services/audit.service";
import { AuthContext } from "../../auth-client/types/auth.types";
import {
  AtualizarFaixaDescontoInput,
  AtualizarTabelaDescontoInput,
  CalcularDescontoDto,
  FaixaDescontoInput,
  ListarTabelasDescontoQueryDto,
  TabelaDescontoInput,
} from "../dto/descontos.dto";
import { FaixaDesconto } from "../entities/faixa-desconto.entity";
import { Item } from "../entities/item.entity";
import { TabelaDesconto } from "../entities/tabela-desconto.entity";
import { TipoDesconto } from "../enums/silo.enums";
import { DescontoCalculator } from "../helpers/desconto-calculator";
import { decimal, numero } from "../helpers/number.utils";
import { SiloRepository } from "../repositories/silo.repository";
import {
  getPagination,
  toPaginatedResponse,
} from "../../shared/utils/pagination";
import { CadastrosService } from "./cadastros.service";

@Injectable()
export class DescontosService {
  constructor(
    private readonly siloRepository: SiloRepository,
    private readonly cadastrosService: CadastrosService,
    private readonly auditService: AuditService,
  ) {}

  async listarTabelas(query: ListarTabelasDescontoQueryDto) {
    const { page, limit, offset } = getPagination(query);
    const where: Record<string, unknown> = {};

    if (query.search) {
      where.nome = { [Op.like]: `%${query.search}%` };
    }

    if (typeof query.ativo === "boolean") {
      where.ativa = query.ativo;
    }

    if (query.item_id) {
      where.item_id = query.item_id;
    }

    const { rows, count } = await this.siloRepository.listarTabelasDesconto({
      where,
      include: [
        { model: Item, as: "item" },
        { model: FaixaDesconto, as: "faixas" },
      ],
      distinct: true,
      limit,
      offset,
      order: [["id_tabela_desconto", "DESC"]],
    });

    return toPaginatedResponse(rows, count, page, limit);
  }

  async criarTabela(
    data: TabelaDescontoInput,
    usuario: AuthContext,
    ip?: string,
  ) {
    const transaction = await this.siloRepository.criarTransacao();
    let tabela: TabelaDesconto;

    try {
      await this.cadastrosService.validarReferenciasBasicas(
        { item_id: data.item_id },
        transaction,
      );
      await this.validarTabelaAtivaUnica(data.item_id, data.ativa, undefined, transaction);
      tabela = await this.siloRepository.criarTabelaDesconto(
        {
          ...data,
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

    const criada = await this.buscarTabelaPorId(tabela!.id_tabela_desconto);
    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "TABELA_DESCONTO_CRIADA",
      recurso: "TABELA_DESCONTO",
      recurso_id: tabela!.id_tabela_desconto,
      valor_novo: this.toPlain(criada),
      ip,
    });
    return criada;
  }

  async buscarTabelaPorId(id: number) {
    const tabela = await this.siloRepository.buscarTabelaDesconto(id, {
      include: [
        { model: Item, as: "item" },
        { model: FaixaDesconto, as: "faixas" },
      ],
    });

    if (!tabela) {
      throw new NotFoundException("Tabela de desconto nao encontrada.");
    }

    return tabela;
  }

  async atualizarTabela(
    id: number,
    data: AtualizarTabelaDescontoInput,
    usuario: AuthContext,
    ip?: string,
  ) {
    const tabela = await this.buscarTabelaPorId(id);
    const anterior = this.toPlain(tabela);
    const itemId = data.item_id || tabela.item_id;
    const ativa = data.ativa === undefined ? tabela.ativa : data.ativa;
    const transaction = await this.siloRepository.criarTransacao();

    try {
      if (data.item_id) {
        await this.cadastrosService.validarReferenciasBasicas(
          { item_id: data.item_id },
          transaction,
        );
      }
      await this.validarTabelaAtivaUnica(itemId, ativa, id, transaction);
      await tabela.update(
        { ...data, atualizado_por: usuario.usuario_id },
        { transaction },
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    const atualizada = await this.buscarTabelaPorId(id);
    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "TABELA_DESCONTO_ATUALIZADA",
      recurso: "TABELA_DESCONTO",
      recurso_id: id,
      valor_anterior: anterior,
      valor_novo: this.toPlain(atualizada),
      ip,
    });
    return atualizada;
  }

  async adicionarFaixa(
    tabelaId: number,
    data: FaixaDescontoInput,
    usuario: AuthContext,
    ip?: string,
  ) {
    const tabela = await this.buscarTabelaPorId(tabelaId);
    const transaction = await this.siloRepository.criarTransacao();
    let faixa: FaixaDesconto;

    try {
      await this.validarFaixa(data);
      await this.validarSobreposicaoFaixa(tabelaId, data, undefined, transaction);
      faixa = await this.siloRepository.criarFaixa(
        {
          tabela_desconto_id: tabela.id_tabela_desconto,
          tipo: data.tipo,
          valor_inicial: decimal(data.valor_inicial, 4),
          valor_final: decimal(data.valor_final, 4),
          percentual_desconto: decimal(data.percentual_desconto, 4),
          ativa: data.ativa,
        },
        transaction,
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "FAIXA_DESCONTO_CRIADA",
      recurso: "TABELA_DESCONTO",
      recurso_id: tabelaId,
      valor_novo: this.toPlain(faixa!),
      ip,
    });

    return faixa!;
  }

  async atualizarFaixa(
    id: number,
    data: AtualizarFaixaDescontoInput,
    usuario: AuthContext,
    ip?: string,
  ) {
    const faixa = await this.buscarFaixaPorId(id);
    const anterior = this.toPlain(faixa);
    const proxima = {
      tipo: data.tipo || faixa.tipo,
      valor_inicial:
        data.valor_inicial === undefined
          ? numero(faixa.valor_inicial)
          : data.valor_inicial,
      valor_final:
        data.valor_final === undefined ? numero(faixa.valor_final) : data.valor_final,
      percentual_desconto:
        data.percentual_desconto === undefined
          ? numero(faixa.percentual_desconto)
          : data.percentual_desconto,
      ativa: data.ativa === undefined ? faixa.ativa : data.ativa,
    };
    const transaction = await this.siloRepository.criarTransacao();

    try {
      await this.validarFaixa(proxima);
      await this.validarSobreposicaoFaixa(
        faixa.tabela_desconto_id,
        proxima,
        id,
        transaction,
      );
      await faixa.update(
        {
          ...data,
          valor_inicial:
            data.valor_inicial === undefined
              ? undefined
              : decimal(data.valor_inicial, 4),
          valor_final:
            data.valor_final === undefined ? undefined : decimal(data.valor_final, 4),
          percentual_desconto:
            data.percentual_desconto === undefined
              ? undefined
              : decimal(data.percentual_desconto, 4),
        },
        { transaction },
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "FAIXA_DESCONTO_ATUALIZADA",
      recurso: "FAIXA_DESCONTO",
      recurso_id: id,
      valor_anterior: anterior,
      valor_novo: this.toPlain(faixa),
      ip,
    });
    return faixa;
  }

  async desativarFaixa(id: number, usuario: AuthContext, ip?: string) {
    const faixa = await this.buscarFaixaPorId(id);
    const anterior = this.toPlain(faixa);
    await faixa.update({ ativa: false });
    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "FAIXA_DESCONTO_DESATIVADA",
      recurso: "FAIXA_DESCONTO",
      recurso_id: id,
      valor_anterior: anterior,
      valor_novo: this.toPlain(faixa),
      ip,
    });
    return faixa;
  }

  async calcular(data: CalcularDescontoDto) {
    return this.calcularPorItem({
      item_id: data.item_id,
      peso_liquido_kg: data.peso_liquido_kg,
      umidade_percentual: data.umidade_percentual,
      impureza_percentual: data.impureza_percentual,
    });
  }

  async calcularPorItem(data: {
    item_id: number;
    peso_liquido_kg: number | string;
    umidade_percentual: number | string;
    impureza_percentual: number | string;
  }) {
    const tabela = await this.siloRepository.buscarTabelaAtivaPorItem(data.item_id);

    if (!tabela) {
      throw new BadRequestException(
        "Nao existe tabela de desconto ativa para o item da pesagem.",
      );
    }

    const faixaUmidade = this.buscarFaixaCompativel(
      tabela.faixas || [],
      "UMIDADE",
      data.umidade_percentual,
    );
    const faixaImpureza = this.buscarFaixaCompativel(
      tabela.faixas || [],
      "IMPUREZA",
      data.impureza_percentual,
    );

    const calculo = DescontoCalculator.calcular({
      peso_liquido_kg: data.peso_liquido_kg,
      desconto_umidade_percentual: faixaUmidade.percentual_desconto,
      desconto_impureza_percentual: faixaImpureza.percentual_desconto,
    });

    return {
      tabela_desconto_id: tabela.id_tabela_desconto,
      umidade_percentual: decimal(data.umidade_percentual, 4),
      impureza_percentual: decimal(data.impureza_percentual, 4),
      ...calculo,
    };
  }

  private async buscarFaixaPorId(id: number) {
    const faixa = await this.siloRepository.buscarFaixa(id);

    if (!faixa) {
      throw new NotFoundException("Faixa de desconto nao encontrada.");
    }

    return faixa;
  }

  private async validarTabelaAtivaUnica(
    itemId: number,
    ativa: boolean | undefined,
    ignorarTabelaId?: number,
    transaction?: Transaction,
  ) {
    if (!ativa) {
      return;
    }

    const totalAtivas = await this.siloRepository.contarTabelasAtivasPorItem(
      itemId,
      ignorarTabelaId,
      transaction,
    );

    if (totalAtivas > 0) {
      throw new BadRequestException(
        "Ja existe tabela de desconto ativa para este item.",
      );
    }
  }

  private async validarFaixa(
    data: Pick<
      FaixaDescontoInput,
      "valor_inicial" | "valor_final" | "percentual_desconto"
    >,
  ) {
    if (numero(data.valor_final) < numero(data.valor_inicial)) {
      throw new BadRequestException(
        "Valor final da faixa deve ser maior ou igual ao valor inicial.",
      );
    }
  }

  private async validarSobreposicaoFaixa(
    tabelaId: number,
    data: Pick<
      FaixaDescontoInput,
      "tipo" | "valor_inicial" | "valor_final" | "ativa"
    >,
    ignorarFaixaId?: number,
    transaction?: Transaction,
  ) {
    if (data.ativa === false) {
      return;
    }

    const where: Record<string, unknown> = {
      tabela_desconto_id: tabelaId,
      tipo: data.tipo,
      ativa: true,
      valor_inicial: { [Op.lte]: decimal(data.valor_final, 4) },
      valor_final: { [Op.gte]: decimal(data.valor_inicial, 4) },
    };

    if (ignorarFaixaId) {
      where.id_faixa_desconto = { [Op.ne]: ignorarFaixaId };
    }

    const conflitos = await this.siloRepository.listarFaixas({
      where,
      transaction,
      limit: 1,
    });

    if (conflitos.length) {
      throw new BadRequestException(
        "Faixa de desconto sobreposta para o mesmo tipo e tabela.",
      );
    }
  }

  private buscarFaixaCompativel(
    faixas: FaixaDesconto[],
    tipo: TipoDesconto,
    valor: unknown,
  ) {
    const valorNumerico = numero(valor);
    const faixa = faixas.find(
      (item) =>
        item.ativa &&
        item.tipo === tipo &&
        numero(item.valor_inicial) <= valorNumerico &&
        numero(item.valor_final) >= valorNumerico,
    );

    if (!faixa) {
      throw new BadRequestException(
        `Nao existe faixa de desconto ativa para ${tipo.toLowerCase()} informado.`,
      );
    }

    return faixa;
  }

  private toPlain(entity: { get: (options: { plain: true }) => object }) {
    return entity.get({ plain: true });
  }
}
