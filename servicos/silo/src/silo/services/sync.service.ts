import { BadRequestException, Injectable } from "@nestjs/common";
import { Op, Transaction, UniqueConstraintError } from "sequelize";
import { AuditService } from "../../audit/services/audit.service";
import { AuthContext } from "../../auth-client/types/auth.types";
import { SincronizarPesagemInput } from "../dto/sync.dto";
import { FaixaDesconto } from "../entities/faixa-desconto.entity";
import { Item } from "../entities/item.entity";
import { RomaneioRange } from "../entities/romaneio-range.entity";
import { PesoCalculator } from "../helpers/peso-calculator";
import { SiloRepository } from "../repositories/silo.repository";
import { PesagensService } from "./pesagens.service";

@Injectable()
export class SyncService {
  constructor(
    private readonly siloRepository: SiloRepository,
    private readonly pesagensService: PesagensService,
    private readonly auditService: AuditService,
  ) {}

  async sincronizarPesagem(
    data: SincronizarPesagemInput,
    usuario: AuthContext,
    ip?: string,
  ) {
    const existente = await this.siloRepository.buscarPesagemPorClientRequestId(
      data.client_request_id,
    );

    if (existente) {
      await this.registrarJaSincronizado(data, existente.id_pesagem, usuario, ip);
      return this.toJaSincronizadoResponse(existente);
    }

    const transaction = await this.siloRepository.criarTransacao({
      isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    });
    let pesagemId = 0;
    let numeroRomaneio = data.numero_romaneio;
    let serieRomaneioId = data.serie_romaneio_id;
    let movimentacaoId: number | null = null;

    try {
      const repetida = await this.siloRepository.buscarPesagemPorClientRequestId(
        data.client_request_id,
        { transaction, lock: transaction.LOCK.UPDATE },
      );

      if (repetida) {
        await transaction.commit();
        await this.registrarJaSincronizado(
          data,
          repetida.id_pesagem,
          usuario,
          ip,
        );
        return this.toJaSincronizadoResponse(repetida);
      }

      this.validarOrigem(data);
      const range = await this.buscarEValidarRange(data, transaction);
      await this.validarRomaneioLivre(data, transaction);

      const dataLocal = new Date(data.created_at_local);
      const pesoLiquidoKg = PesoCalculator.calcularPesoLiquidoKg(
        data.pesagem_1_kg,
        data.pesagem_2_kg,
      );
      const pesagem = await this.pesagensService.criarComRomaneioReservado(
        {
          ...data,
          contrato_id: data.contrato_id || null,
          observacao: data.observacao || null,
          serie_romaneio_id: range.serie_romaneio_id,
          numero_romaneio: data.numero_romaneio,
          origem: data.origem || "DESKTOP_OFFLINE",
          romaneio_range_id: range.id_romaneio_range,
          peso_liquido_kg: pesoLiquidoKg,
          data_pesagem_1: dataLocal,
          data_pesagem_2: dataLocal,
          created_at_local: dataLocal,
          status: "PESAGEM_2_REALIZADA",
        },
        usuario,
        transaction,
      );

      pesagemId = pesagem.id_pesagem;
      numeroRomaneio = pesagem.numero_romaneio;
      serieRomaneioId = pesagem.serie_romaneio_id;

      if (this.possuiClassificacao(data)) {
        this.validarClassificacaoCompleta(data);
        await this.pesagensService.classificarEmTransacao(
          pesagem,
          {
            umidade_percentual: data.umidade_percentual!,
            impureza_percentual: data.impureza_percentual!,
          },
          usuario,
          transaction,
        );
      }

      if (data.finalizar !== false) {
        const resultado = await this.pesagensService.finalizarEmTransacao(
          pesagem.id_pesagem,
          {
            permitir_saldo_negativo: data.permitir_saldo_negativo,
            justificativa: data.justificativa || null,
          },
          usuario,
          transaction,
        );
        movimentacaoId = resultado.movimentacao.id_movimentacao_produto;
      }

      await this.atualizarUsoRange(range, data.numero_romaneio, transaction);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();

      if (error instanceof UniqueConstraintError) {
        const sincronizada =
          await this.siloRepository.buscarPesagemPorClientRequestId(
            data.client_request_id,
          );

        if (sincronizada) {
          await this.registrarJaSincronizado(
            data,
            sincronizada.id_pesagem,
            usuario,
            ip,
          );
          return this.toJaSincronizadoResponse(sincronizada);
        }
      }

      await this.auditService.registrar({
        conta_id: usuario.conta_id,
        usuario_id: usuario.usuario_id,
        acao:
          error instanceof BadRequestException
            ? "SYNC_PESAGEM_CONFLITO"
            : "SYNC_PESAGEM_ERRO",
        recurso: "PESAGEM",
        valor_novo: {
          client_request_id: data.client_request_id,
          balanca_client_id: data.balanca_client_id,
          romaneio_range_id: data.romaneio_range_id,
          serie_romaneio_id: data.serie_romaneio_id,
          numero_romaneio: data.numero_romaneio,
          erro: error instanceof Error ? error.message : String(error),
        },
        ip,
      });
      throw error;
    }

    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "SYNC_PESAGEM_SINCRONIZADA",
      recurso: "PESAGEM",
      recurso_id: pesagemId,
      valor_novo: {
        client_request_id: data.client_request_id,
        balanca_client_id: data.balanca_client_id,
        romaneio_range_id: data.romaneio_range_id,
        numero_romaneio: numeroRomaneio,
      },
      ip,
    });

    return {
      status: "SINCRONIZADO",
      pesagem_id: pesagemId,
      numero_romaneio: numeroRomaneio,
      serie_romaneio_id: serieRomaneioId,
      movimentacao_id: movimentacaoId,
    };
  }

  async bootstrap(usuario: AuthContext) {
    const limit = 1000;
    const [
      contasProduto,
      itens,
      transportadoras,
      emissores,
      depositos,
      destinos,
      lotesOperacionais,
      contratos,
      tabelasDesconto,
      faixasDesconto,
      serieAtiva,
    ] = await Promise.all([
      this.siloRepository.listarContasProduto({
        where: { ativa: true },
        attributes: [
          "id_conta_produto",
          "entidade_id_ref",
          "nome",
          "documento",
          "ativa",
        ],
        limit,
        order: [["nome", "ASC"]],
      }),
      this.siloRepository.listarItens({
        where: { ativo: true },
        attributes: [
          "id_item",
          "nome",
          "unidade_medida",
          "controla_estoque",
          "exige_classificacao",
          "ativo",
        ],
        limit,
        order: [["nome", "ASC"]],
      }),
      this.siloRepository.listarTransportadoras({
        where: { ativa: true },
        attributes: [
          "id_transportadora",
          "entidade_id_ref",
          "nome",
          "documento",
          "telefone",
          "observacao",
          "ativa",
        ],
        limit,
        order: [["nome", "ASC"]],
      }),
      this.siloRepository.listarEmissores({
        where: { ativo: true },
        attributes: [
          "id_emissor",
          "entidade_id_ref",
          "nome",
          "documento",
          "observacao",
          "ativo",
        ],
        limit,
        order: [["nome", "ASC"]],
      }),
      this.siloRepository.listarDepositos({
        where: { ativo: true },
        attributes: ["id_deposito", "nome", "descricao", "ativo"],
        limit,
        order: [["nome", "ASC"]],
      }),
      this.siloRepository.listarDestinos({
        where: { ativo: true },
        attributes: ["id_destino", "nome", "descricao", "ativo"],
        limit,
        order: [["nome", "ASC"]],
      }),
      this.siloRepository.listarLotes({
        where: { status: { [Op.in]: ["ABERTO", "EM_ANDAMENTO"] } },
        attributes: [
          "id_lote_operacional",
          "nome",
          "tipo",
          "status",
          "conta_produto_id",
          "item_id",
          "contrato_id",
          "destino_id",
        ],
        limit,
        order: [["id_lote_operacional", "DESC"]],
      }),
      this.siloRepository.listarContratos({
        where: { status: { [Op.in]: ["ABERTO", "PARCIAL"] } },
        attributes: [
          "id_contrato",
          "numero_contrato",
          "conta_produto_id",
          "item_id",
          "comprador_entidade_id_ref",
          "comprador_nome_cache",
          "quantidade_contratada_kg",
          "quantidade_entregue_kg",
          "saldo_kg",
          "status",
        ],
        limit,
        order: [["id_contrato", "DESC"]],
      }),
      this.siloRepository.listarTabelasDesconto({
        where: { ativa: true },
        attributes: [
          "id_tabela_desconto",
          "item_id",
          "nome",
          "ativa",
          "vigencia_inicio",
          "vigencia_fim",
        ],
        include: [
          { model: Item, as: "item", attributes: ["id_item", "nome"] },
          {
            model: FaixaDesconto,
            as: "faixas",
            where: { ativa: true },
            required: false,
          },
        ],
        distinct: true,
        limit,
        order: [["id_tabela_desconto", "DESC"]],
      }),
      this.siloRepository.listarFaixas({
        where: { ativa: true },
        attributes: [
          "id_faixa_desconto",
          "tabela_desconto_id",
          "tipo",
          "valor_inicial",
          "valor_final",
          "percentual_desconto",
          "ativa",
        ],
        order: [["id_faixa_desconto", "ASC"]],
      }),
      this.siloRepository.buscarSerieAtiva(),
    ]);

    return {
      servidor_data_hora: new Date().toISOString(),
      usuario: this.toUsuarioSync(usuario),
      permissoes: usuario.modulos,
      serie_romaneio_ativa: serieAtiva ? this.toPlain(serieAtiva) : null,
      contas_produto: contasProduto.rows.map((item) => this.toPlain(item)),
      itens: itens.rows.map((item) => this.toPlain(item)),
      transportadoras: transportadoras.rows.map((item) => this.toPlain(item)),
      emissores: emissores.rows.map((item) => this.toPlain(item)),
      depositos: depositos.rows.map((item) => this.toPlain(item)),
      destinos: destinos.rows.map((item) => this.toPlain(item)),
      lotes_operacionais: lotesOperacionais.rows.map((item) =>
        this.toPlain(item),
      ),
      contratos: contratos.rows.map((item) => this.toPlain(item)),
      tabelas_desconto: tabelasDesconto.rows.map((item) => this.toPlain(item)),
      faixas_desconto: faixasDesconto.map((item) => this.toPlain(item)),
    };
  }

  async status(usuario: AuthContext) {
    const serieAtiva = await this.siloRepository.buscarSerieAtiva();

    return {
      online: true,
      servidor_data_hora: new Date().toISOString(),
      usuario: this.toUsuarioSync(usuario),
      permissoes: usuario.modulos,
      serie_romaneio_ativa: serieAtiva ? this.toPlain(serieAtiva) : null,
      diagnostico: {
        servico: "silo",
        sync_pesagens: true,
        reserva_faixa_romaneio: true,
      },
    };
  }

  private async buscarEValidarRange(
    data: SincronizarPesagemInput,
    transaction: Transaction,
  ) {
    const range = await this.siloRepository.buscarRomaneioRange(
      data.romaneio_range_id,
      transaction,
      true,
    );

    if (!range) {
      throw new BadRequestException("Faixa de romaneio reservada nao encontrada.");
    }

    if (range.expira_em && range.expira_em < new Date()) {
      await range.update({ status: "EXPIRADA" }, { transaction });
      throw new BadRequestException("Faixa de romaneio reservada esta expirada.");
    }

    if (range.status !== "ATIVA") {
      throw new BadRequestException(
        `Faixa de romaneio reservada nao esta ativa: ${range.status}.`,
      );
    }

    if (range.balanca_client_id !== data.balanca_client_id) {
      throw new BadRequestException(
        "Faixa de romaneio nao pertence a balanca informada.",
      );
    }

    if (range.serie_romaneio_id !== data.serie_romaneio_id) {
      throw new BadRequestException(
        "Serie de romaneio informada nao confere com a faixa reservada.",
      );
    }

    if (
      data.numero_romaneio < range.numero_inicial ||
      data.numero_romaneio > range.numero_final
    ) {
      throw new BadRequestException(
        "Numero de romaneio fora da faixa reservada.",
      );
    }

    return range;
  }

  private async validarRomaneioLivre(
    data: SincronizarPesagemInput,
    transaction: Transaction,
  ) {
    const existente = await this.siloRepository.buscarPesagemPorRomaneio(
      data.serie_romaneio_id,
      data.numero_romaneio,
      transaction,
    );

    if (existente) {
      throw new BadRequestException(
        "Numero de romaneio ja foi utilizado por outra pesagem.",
      );
    }
  }

  private async atualizarUsoRange(
    range: RomaneioRange,
    numeroRomaneio: number,
    transaction: Transaction,
  ) {
    const quantidadeUsada = await this.siloRepository.contarPesagensPorRange(
      range.id_romaneio_range,
      transaction,
    );
    const proximoNumero = Math.min(
      range.numero_final + 1,
      Math.max(range.proximo_numero, numeroRomaneio + 1),
    );

    await range.update(
      {
        quantidade_usada: quantidadeUsada,
        proximo_numero: proximoNumero,
        status:
          quantidadeUsada >= range.quantidade_reservada ? "ESGOTADA" : "ATIVA",
      },
      { transaction },
    );
  }

  private validarOrigem(data: SincronizarPesagemInput) {
    if (data.origem === "WEB") {
      throw new BadRequestException(
        "Endpoint de sincronizacao aceita apenas origem desktop.",
      );
    }
  }

  private possuiClassificacao(data: SincronizarPesagemInput) {
    return (
      data.umidade_percentual !== undefined ||
      data.impureza_percentual !== undefined
    );
  }

  private validarClassificacaoCompleta(data: SincronizarPesagemInput) {
    if (
      data.umidade_percentual === undefined ||
      data.impureza_percentual === undefined
    ) {
      throw new BadRequestException(
        "Umidade e impureza devem ser informadas juntas para classificar.",
      );
    }
  }

  private async registrarJaSincronizado(
    data: SincronizarPesagemInput,
    pesagemId: number,
    usuario: AuthContext,
    ip?: string,
  ) {
    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "SYNC_PESAGEM_JA_SINCRONIZADA",
      recurso: "PESAGEM",
      recurso_id: pesagemId,
      valor_novo: {
        client_request_id: data.client_request_id,
        balanca_client_id: data.balanca_client_id,
        romaneio_range_id: data.romaneio_range_id,
        numero_romaneio: data.numero_romaneio,
      },
      ip,
    });
  }

  private toJaSincronizadoResponse(pesagem: {
    id_pesagem: number;
    numero_romaneio: number;
    serie_romaneio_id: number;
  }) {
    return {
      status: "JA_SINCRONIZADO",
      pesagem_id: pesagem.id_pesagem,
      numero_romaneio: pesagem.numero_romaneio,
      serie_romaneio_id: pesagem.serie_romaneio_id,
    };
  }

  private toUsuarioSync(usuario: AuthContext) {
    return {
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      nome: usuario.nome,
      email: usuario.email,
      possuiAdmin: usuario.possuiAdmin,
      possuiGerente: usuario.possuiGerente,
    };
  }

  private toPlain(entity: { get: (options: { plain: true }) => object }) {
    return entity.get({ plain: true });
  }
}
