import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Op, Transaction } from "sequelize";
import { AuditService } from "../auditoria/services/audit.service";
import { AuthContext } from "../auth-client/types/auth.types";
import {
  AtualizarPesagemInput,
  CancelarPesagemDto,
  ClassificarPesagemDto,
  FinalizarPesagemDto,
  ListarPesagensQuery,
  PesagemInput,
  RegistrarPesagemDto,
} from "../dto/pesagens.dto";
import { ClassificacaoPesagem } from "../entities/classificacao-pesagem.entity";
import { ContaProduto } from "../entities/conta-produto.entity";
import { Contrato } from "../entities/contrato.entity";
import { Deposito } from "../entities/deposito.entity";
import { Destino } from "../entities/destino.entity";
import { Emissor } from "../entities/emissor.entity";
import { Item } from "../entities/item.entity";
import { LoteOperacional } from "../entities/lote-operacional.entity";
import { Pesagem } from "../entities/pesagem.entity";
import { SerieRomaneio } from "../entities/serie-romaneio.entity";
import { Transportadora } from "../entities/transportadora.entity";
import {
  PesagemOrigem,
  PesagemStatus,
} from "../enums/silo.enums";
import { decimal } from "../helpers/number.utils";
import { PesoCalculator } from "../helpers/peso-calculator";
import { SiloRepository } from "../repositories/silo.repository";
import {
  getPagination,
  toPaginatedResponse,
} from "../../shared/utils/pagination";
import { CadastrosService } from "./cadastros.service";
import { DescontosService } from "./descontos.service";
import { LotesOperacionaisService } from "./lotes-operacionais.service";
import { MovimentacaoService } from "./movimentacao.service";

const PESAGEM_INCLUDES = [
  { model: LoteOperacional, as: "lote_operacional" },
  { model: SerieRomaneio, as: "serie_romaneio" },
  { model: ContaProduto, as: "conta_produto" },
  { model: Item, as: "item" },
  { model: Transportadora, as: "transportadora" },
  { model: Emissor, as: "emissor" },
  { model: Deposito, as: "deposito" },
  { model: Destino, as: "destino" },
  { model: Contrato, as: "contrato" },
  { model: ClassificacaoPesagem, as: "classificacao" },
];

export type CriarPesagemComRomaneioInput = PesagemInput & {
  serie_romaneio_id: number;
  numero_romaneio: number;
  client_request_id?: string | null;
  balanca_client_id?: string | null;
  origem?: PesagemOrigem;
  romaneio_range_id?: number | null;
  pesagem_1_kg?: number;
  pesagem_2_kg?: number;
  peso_liquido_kg?: string | null;
  data_pesagem_1?: Date | null;
  data_pesagem_2?: Date | null;
  finalizada_em?: Date | null;
  created_at_local?: Date | null;
  status?: PesagemStatus;
};

@Injectable()
export class PesagensService {
  constructor(
    private readonly siloRepository: SiloRepository,
    private readonly cadastrosService: CadastrosService,
    private readonly lotesService: LotesOperacionaisService,
    private readonly descontosService: DescontosService,
    private readonly movimentacaoService: MovimentacaoService,
    private readonly auditService: AuditService,
  ) {}

  async listar(query: ListarPesagensQuery) {
    const { page, limit, offset } = getPagination(query);
    const where: Record<string, unknown> = {};

    if (query.search) {
      where[Op.or as unknown as string] = [
        { placa: { [Op.like]: `%${query.search}%` } },
        { motorista_nome: { [Op.like]: `%${query.search}%` } },
        { numero_romaneio: Number(query.search) || 0 },
      ];
    }

    if (query.status) where.status = query.status;
    if (query.tipo_operacao) where.tipo_operacao = query.tipo_operacao;
    if (query.lote_operacional_id) where.lote_operacional_id = query.lote_operacional_id;
    if (query.conta_produto_id) where.conta_produto_id = query.conta_produto_id;
    if (query.item_id) where.item_id = query.item_id;

    const { rows, count } = await this.siloRepository.listarPesagens({
      where,
      include: PESAGEM_INCLUDES,
      distinct: true,
      limit,
      offset,
      order: [["id_pesagem", "DESC"]],
    });

    return toPaginatedResponse(rows, count, page, limit);
  }

  async criar(data: PesagemInput, usuario: AuthContext, ip?: string) {
    const transaction = await this.siloRepository.criarTransacao();
    let pesagem: Pesagem;

    try {
      const lote = await this.lotesService.buscarPorId(
        data.lote_operacional_id,
        transaction,
      );
      this.validarLotePermitePesagem(lote);

      const contaProdutoId = data.conta_produto_id || lote.conta_produto_id;
      const itemId = data.item_id || lote.item_id;
      const destinoId = data.destino_id || lote.destino_id;
      const contratoId =
        data.contrato_id === undefined ? lote.contrato_id : data.contrato_id;

      if (!destinoId) {
        throw new BadRequestException(
          "Destino e obrigatorio na pesagem ou no lote operacional.",
        );
      }

      await this.cadastrosService.validarReferenciasBasicas(
        {
          conta_produto_id: contaProdutoId,
          item_id: itemId,
          transportadora_id: data.transportadora_id,
          emissor_id: data.emissor_id,
          deposito_id: data.deposito_id,
          destino_id: destinoId,
        },
        transaction,
      );
      await this.validarContrato(contratoId || null, transaction);

      const serie = await this.siloRepository.buscarSerieAtiva(transaction);

      if (!serie) {
        throw new BadRequestException(
          "Nao existe serie de romaneio ativa. Um GERENTE ou ADMIN deve iniciar uma serie.",
        );
      }

      const numeroRomaneio = serie.proximo_numero;
      await serie.update(
        { proximo_numero: numeroRomaneio + 1 },
        { transaction },
      );

      pesagem = await this.siloRepository.criarPesagem(
        {
          lote_operacional_id: lote.id_lote_operacional,
          serie_romaneio_id: serie.id_serie_romaneio,
          numero_romaneio: numeroRomaneio,
          tipo_operacao: data.tipo_operacao,
          status: "ABERTA",
          conta_produto_id: contaProdutoId,
          item_id: itemId,
          transportadora_id: data.transportadora_id,
          emissor_id: data.emissor_id,
          deposito_id: data.deposito_id,
          destino_id: destinoId,
          contrato_id: contratoId || null,
          placa: data.placa,
          motorista_nome: data.motorista_nome,
          observacao: data.observacao || null,
          criado_por: usuario.usuario_id,
          atualizado_por: usuario.usuario_id,
        },
        transaction,
      );

      if (lote.status === "ABERTO") {
        await lote.update(
          { status: "EM_ANDAMENTO", atualizado_por: usuario.usuario_id },
          { transaction },
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    const criada = await this.buscarPorId(pesagem!.id_pesagem);
    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "PESAGEM_CRIADA",
      recurso: "PESAGEM",
      recurso_id: pesagem!.id_pesagem,
      valor_novo: this.toPlain(criada),
      ip,
    });
    return criada;
  }

  async buscarPorId(id: number, transaction?: Transaction) {
    const pesagem = await this.siloRepository.buscarPesagem(id, {
      include: PESAGEM_INCLUDES,
      transaction,
    });

    if (!pesagem) {
      throw new NotFoundException("Pesagem nao encontrada.");
    }

    return pesagem;
  }

  async criarComRomaneioReservado(
    data: CriarPesagemComRomaneioInput,
    usuario: AuthContext,
    transaction: Transaction,
  ) {
    const lote = await this.lotesService.buscarPorId(
      data.lote_operacional_id,
      transaction,
    );
    this.validarLotePermitePesagem(lote);

    const contaProdutoId = data.conta_produto_id || lote.conta_produto_id;
    const itemId = data.item_id || lote.item_id;
    const destinoId = data.destino_id || lote.destino_id;
    const contratoId =
      data.contrato_id === undefined ? lote.contrato_id : data.contrato_id;

    if (!destinoId) {
      throw new BadRequestException(
        "Destino e obrigatorio na pesagem ou no lote operacional.",
      );
    }

    await this.cadastrosService.validarReferenciasBasicas(
      {
        conta_produto_id: contaProdutoId,
        item_id: itemId,
        transportadora_id: data.transportadora_id,
        emissor_id: data.emissor_id,
        deposito_id: data.deposito_id,
        destino_id: destinoId,
      },
      transaction,
    );
    await this.validarContrato(contratoId || null, transaction);

    const pesagem = await this.siloRepository.criarPesagem(
      {
        lote_operacional_id: lote.id_lote_operacional,
        serie_romaneio_id: data.serie_romaneio_id,
        numero_romaneio: data.numero_romaneio,
        client_request_id: data.client_request_id || null,
        balanca_client_id: data.balanca_client_id || null,
        origem: data.origem || "WEB",
        romaneio_range_id: data.romaneio_range_id || null,
        tipo_operacao: data.tipo_operacao,
        status: data.status || "ABERTA",
        conta_produto_id: contaProdutoId,
        item_id: itemId,
        transportadora_id: data.transportadora_id,
        emissor_id: data.emissor_id,
        deposito_id: data.deposito_id,
        destino_id: destinoId,
        contrato_id: contratoId || null,
        placa: data.placa,
        motorista_nome: data.motorista_nome,
        observacao: data.observacao || null,
        pesagem_1_kg:
          data.pesagem_1_kg === undefined ? null : decimal(data.pesagem_1_kg),
        pesagem_2_kg:
          data.pesagem_2_kg === undefined ? null : decimal(data.pesagem_2_kg),
        peso_liquido_kg: data.peso_liquido_kg || null,
        data_pesagem_1: data.data_pesagem_1 || null,
        data_pesagem_2: data.data_pesagem_2 || null,
        finalizada_em: data.finalizada_em || null,
        created_at_local: data.created_at_local || null,
        criado_por: usuario.usuario_id,
        atualizado_por: usuario.usuario_id,
      },
      transaction,
    );

    if (lote.status === "ABERTO") {
      await lote.update(
        { status: "EM_ANDAMENTO", atualizado_por: usuario.usuario_id },
        { transaction },
      );
    }

    return pesagem;
  }

  async atualizar(
    id: number,
    data: AtualizarPesagemInput,
    usuario: AuthContext,
    ip?: string,
  ) {
    const pesagem = await this.buscarPesagemParaEdicao(id, usuario);
    const anterior = this.toPlain(await this.buscarPorId(id));
    const transaction = await this.siloRepository.criarTransacao();

    try {
      await this.cadastrosService.validarReferenciasBasicas(
        {
          conta_produto_id: data.conta_produto_id,
          item_id: data.item_id,
          transportadora_id: data.transportadora_id,
          emissor_id: data.emissor_id,
          deposito_id: data.deposito_id,
          destino_id: data.destino_id,
        },
        transaction,
      );
      await this.validarContrato(data.contrato_id || null, transaction);
      await pesagem.update(
        { ...data, atualizado_por: usuario.usuario_id },
        { transaction },
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    const atualizada = await this.buscarPorId(id);
    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "PESAGEM_ATUALIZADA",
      recurso: "PESAGEM",
      recurso_id: id,
      valor_anterior: anterior,
      valor_novo: this.toPlain(atualizada),
      ip,
    });
    return atualizada;
  }

  registrarPesagem1(id: number, data: RegistrarPesagemDto, usuario: AuthContext) {
    return this.registrarPeso(id, "pesagem_1_kg", data.peso_kg, usuario);
  }

  registrarPesagem2(id: number, data: RegistrarPesagemDto, usuario: AuthContext) {
    return this.registrarPeso(id, "pesagem_2_kg", data.peso_kg, usuario);
  }

  async classificar(
    id: number,
    data: ClassificarPesagemDto,
    usuario: AuthContext,
    ip?: string,
  ) {
    const pesagem = await this.buscarPorId(id);
    const anterior = pesagem.classificacao
      ? this.toPlain(pesagem.classificacao)
      : null;
    const transaction = await this.siloRepository.criarTransacao();
    let classificacao: ClassificacaoPesagem;

    try {
      classificacao = await this.classificarEmTransacao(
        pesagem,
        data,
        usuario,
        transaction,
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    const atualizada = await this.buscarPorId(id);
    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: anterior ? "CLASSIFICACAO_ATUALIZADA" : "CLASSIFICACAO_CRIADA",
      recurso: "PESAGEM",
      recurso_id: id,
      valor_anterior: anterior,
      valor_novo: this.toPlain(classificacao!),
      ip,
    });
    return atualizada;
  }

  async classificarEmTransacao(
    pesagem: Pesagem,
    data: ClassificarPesagemDto,
    usuario: AuthContext,
    transaction: Transaction,
  ) {
    if (["FINALIZADA", "CANCELADA"].includes(pesagem.status)) {
      throw new BadRequestException(
        "Pesagem finalizada ou cancelada nao pode ser classificada.",
      );
    }

    if (!pesagem.peso_liquido_kg) {
      throw new BadRequestException(
        "Nao e possivel classificar sem peso liquido calculado.",
      );
    }

    const calculo = await this.descontosService.calcularPorItem(
      {
        item_id: pesagem.item_id,
        peso_liquido_kg: pesagem.peso_liquido_kg,
        umidade_percentual: data.umidade_percentual,
        impureza_percentual: data.impureza_percentual,
      },
      transaction,
    );
    const existente = await this.siloRepository.buscarClassificacaoPorPesagem(
      pesagem.id_pesagem,
      transaction,
    );

    if (existente) {
      await existente.update(
        {
          ...calculo,
          atualizado_por: usuario.usuario_id,
          atualizado_em: new Date(),
        },
        { transaction },
      );
      await pesagem.update(
        { status: "CLASSIFICADA", atualizado_por: usuario.usuario_id },
        { transaction },
      );
      return existente;
    }

    const classificacao = await this.siloRepository.criarClassificacao(
      {
        pesagem_id: pesagem.id_pesagem,
        ...calculo,
        classificado_por: usuario.usuario_id,
        classificado_em: new Date(),
      },
      transaction,
    );

    await pesagem.update(
      { status: "CLASSIFICADA", atualizado_por: usuario.usuario_id },
      { transaction },
    );
    return classificacao;
  }

  async finalizar(
    id: number,
    data: FinalizarPesagemDto,
    usuario: AuthContext,
    ip?: string,
  ) {
    const transaction = await this.siloRepository.criarTransacao();
    let anterior: object | null = null;

    try {
      const resultado = await this.finalizarEmTransacao(
        id,
        data,
        usuario,
        transaction,
      );
      anterior = resultado.anterior;
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    const finalizada = await this.buscarPorId(id);
    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: data.permitir_saldo_negativo
        ? "PESAGEM_FINALIZADA_SALDO_NEGATIVO"
        : "PESAGEM_FINALIZADA",
      recurso: "PESAGEM",
      recurso_id: id,
      valor_anterior: anterior,
      valor_novo: this.toPlain(finalizada),
      justificativa: data.justificativa || null,
      ip,
    });
    return finalizada;
  }

  async finalizarEmTransacao(
    id: number,
    data: FinalizarPesagemDto,
    usuario: AuthContext,
    transaction: Transaction,
  ) {
    if (data.permitir_saldo_negativo && !this.isGerenteOuAdmin(usuario)) {
      throw new BadRequestException(
        "Apenas ADMIN ou GERENTE pode permitir saida com saldo negativo.",
      );
    }

    if (data.permitir_saldo_negativo && !data.justificativa) {
      throw new BadRequestException(
        "Justificativa e obrigatoria para permitir saldo negativo.",
      );
    }

    const pesagem = await this.buscarPorId(id, transaction);
    const anterior = this.toPlain(pesagem);

    if (pesagem.status === "FINALIZADA") {
      throw new BadRequestException("Pesagem ja esta finalizada.");
    }

    if (pesagem.status === "CANCELADA") {
      throw new BadRequestException("Pesagem cancelada nao pode ser finalizada.");
    }

    if (!pesagem.pesagem_1_kg || !pesagem.pesagem_2_kg || !pesagem.peso_liquido_kg) {
      throw new BadRequestException(
        "Nao e possivel finalizar sem pesagem 1 e pesagem 2.",
      );
    }

    if (pesagem.item?.exige_classificacao && !pesagem.classificacao) {
      throw new BadRequestException(
        "Item exige classificacao antes da finalizacao.",
      );
    }

    const movimentacao =
      await this.movimentacaoService.gerarMovimentacaoFinalizacao({
        pesagem: pesagem as Pesagem & { classificacao?: ClassificacaoPesagem },
        usuario,
        permitirSaldoNegativo: data.permitir_saldo_negativo,
        transaction,
      });

    await pesagem.update(
      {
        status: "FINALIZADA",
        finalizada_em: new Date(),
        atualizado_por: usuario.usuario_id,
      },
      { transaction },
    );

    return { anterior, movimentacao };
  }

  async cancelar(
    id: number,
    data: CancelarPesagemDto,
    usuario: AuthContext,
    ip?: string,
  ) {
    const pesagem = await this.buscarPorId(id);

    if (pesagem.status === "CANCELADA") {
      throw new BadRequestException("Pesagem ja esta cancelada.");
    }

    if (pesagem.status === "FINALIZADA") {
      const movimentacao = await this.siloRepository.buscarMovimentacaoPorPesagem(id);
      if (movimentacao) {
        throw new BadRequestException(
          "Pesagem finalizada com movimentacao nao pode ser cancelada sem rotina de estorno.",
        );
      }
    }

    const anterior = this.toPlain(pesagem);
    await pesagem.update({
      status: "CANCELADA",
      atualizado_por: usuario.usuario_id,
    });

    const cancelada = await this.buscarPorId(id);
    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "PESAGEM_CANCELADA",
      recurso: "PESAGEM",
      recurso_id: id,
      valor_anterior: anterior,
      valor_novo: this.toPlain(cancelada),
      justificativa: data.justificativa,
      ip,
    });

    return cancelada;
  }

  private async registrarPeso(
    id: number,
    campo: "pesagem_1_kg" | "pesagem_2_kg",
    pesoKg: number,
    usuario: AuthContext,
  ) {
    const pesagem = await this.buscarPesagemParaEdicao(id, usuario);

    if (pesagem.status === "CLASSIFICADA") {
      throw new BadRequestException(
        "Pesagem classificada nao pode ter peso fisico alterado.",
      );
    }

    const dataCampo =
      campo === "pesagem_1_kg" ? "data_pesagem_1" : "data_pesagem_2";
    const update: Record<string, unknown> = {
      [campo]: decimal(pesoKg),
      [dataCampo]: new Date(),
      atualizado_por: usuario.usuario_id,
    };
    const pesagem1 = campo === "pesagem_1_kg" ? decimal(pesoKg) : pesagem.pesagem_1_kg;
    const pesagem2 = campo === "pesagem_2_kg" ? decimal(pesoKg) : pesagem.pesagem_2_kg;

    if (pesagem1 && pesagem2) {
      update.peso_liquido_kg = PesoCalculator.calcularPesoLiquidoKg(
        pesagem1,
        pesagem2,
      );
      update.status = "PESAGEM_2_REALIZADA";
    } else {
      update.status = "PESAGEM_1_REALIZADA";
    }

    await pesagem.update(update);
    return this.buscarPorId(id);
  }

  private async buscarPesagemParaEdicao(id: number, usuario: AuthContext) {
    const pesagem = await this.siloRepository.buscarPesagem(id);

    if (!pesagem) {
      throw new NotFoundException("Pesagem nao encontrada.");
    }

    if (["FINALIZADA", "CANCELADA"].includes(pesagem.status)) {
      if (!this.isGerenteOuAdmin(usuario)) {
        throw new BadRequestException(
          "Pesagem finalizada ou cancelada nao pode ser editada.",
        );
      }

      throw new BadRequestException(
        "Pesagem finalizada ou cancelada exige acao especifica de GERENTE/ADMIN.",
      );
    }

    return pesagem;
  }

  private validarLotePermitePesagem(lote: LoteOperacional) {
    if (["FECHADO", "CANCELADO"].includes(lote.status)) {
      throw new BadRequestException(
        "Lote operacional fechado ou cancelado nao pode receber pesagem.",
      );
    }
  }

  private async validarContrato(
    contratoId: number | null,
    transaction?: Transaction,
  ) {
    if (!contratoId) {
      return;
    }

    const contrato = await this.siloRepository.buscarContrato(contratoId, {
      transaction,
    });

    if (!contrato) {
      throw new NotFoundException("Contrato nao encontrado.");
    }
  }

  private isGerenteOuAdmin(usuario: AuthContext) {
    return Boolean(usuario.possuiAdmin || usuario.possuiGerente);
  }

  private toPlain(entity: { get: (options: { plain: true }) => object }) {
    return entity.get({ plain: true });
  }
}
