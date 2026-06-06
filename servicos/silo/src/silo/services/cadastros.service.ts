import { Injectable, NotFoundException } from "@nestjs/common";
import { Op, Transaction } from "sequelize";
import { AuditService } from "../../audit/services/audit.service";
import { AuthContext } from "../../auth-client/types/auth.types";
import {
  AtualizarContaProdutoInput,
  AtualizarDepositoInput,
  AtualizarDestinoInput,
  AtualizarEmissorInput,
  AtualizarItemInput,
  AtualizarTransportadoraInput,
  ContaProdutoInput,
  DepositoInput,
  DestinoInput,
  EmissorInput,
  ItemInput,
  ListarCadastrosQueryDto,
  SerieRomaneioInput,
  TransportadoraInput,
} from "../dto/cadastros.dto";
import { ContaProduto } from "../entities/conta-produto.entity";
import { Deposito } from "../entities/deposito.entity";
import { Destino } from "../entities/destino.entity";
import { Emissor } from "../entities/emissor.entity";
import { Item } from "../entities/item.entity";
import { SerieRomaneio } from "../entities/serie-romaneio.entity";
import { Transportadora } from "../entities/transportadora.entity";
import { SiloRepository } from "../repositories/silo.repository";
import {
  getPagination,
  toPaginatedResponse,
} from "../../shared/utils/pagination";

@Injectable()
export class CadastrosService {
  constructor(
    private readonly siloRepository: SiloRepository,
    private readonly auditService: AuditService,
  ) {}

  async listarContasProduto(query: ListarCadastrosQueryDto) {
    const { page, limit, offset } = getPagination(query);
    const where = this.buildWhere(query, "ativa", ["nome", "documento"]);
    const { rows, count } = await this.siloRepository.listarContasProduto({
      where,
      limit,
      offset,
      order: [["nome", "ASC"]],
    });

    return toPaginatedResponse(rows, count, page, limit);
  }

  async criarContaProduto(
    data: ContaProdutoInput,
    usuario: AuthContext,
    ip?: string,
  ) {
    const conta = await this.siloRepository.criarContaProduto({
      ...data,
      criado_por: usuario.usuario_id,
      atualizado_por: usuario.usuario_id,
    });
    await this.registrarAuditoria(usuario, "CONTA_PRODUTO_CRIADA", conta, ip);
    return conta;
  }

  async buscarContaProduto(id: number) {
    const conta = await this.siloRepository.buscarContaProduto(id);
    if (!conta) {
      throw new NotFoundException("Conta de produto nao encontrada.");
    }
    return conta;
  }

  async atualizarContaProduto(
    id: number,
    data: AtualizarContaProdutoInput,
    usuario: AuthContext,
    ip?: string,
  ) {
    const conta = await this.buscarContaProduto(id);
    const anterior = this.toPlain(conta);
    await conta.update({ ...data, atualizado_por: usuario.usuario_id });
    await this.registrarAuditoria(
      usuario,
      "CONTA_PRODUTO_ATUALIZADA",
      conta,
      ip,
      anterior,
    );
    return conta;
  }

  async removerContaProduto(id: number, usuario: AuthContext, ip?: string) {
    const conta = await this.buscarContaProduto(id);
    const anterior = this.toPlain(conta);
    await conta.update({ ativa: false, atualizado_por: usuario.usuario_id });
    await conta.destroy();
    await this.registrarAuditoria(
      usuario,
      "CONTA_PRODUTO_REMOVIDA",
      conta,
      ip,
      anterior,
    );
  }

  async listarItens(query: ListarCadastrosQueryDto) {
    const { page, limit, offset } = getPagination(query);
    const where = this.buildWhere(query, "ativo", ["nome", "unidade_medida"]);
    const { rows, count } = await this.siloRepository.listarItens({
      where,
      limit,
      offset,
      order: [["nome", "ASC"]],
    });

    return toPaginatedResponse(rows, count, page, limit);
  }

  async criarItem(data: ItemInput, usuario: AuthContext, ip?: string) {
    const item = await this.siloRepository.criarItem({ ...data });
    await this.registrarAuditoria(usuario, "ITEM_CRIADO", item, ip);
    return item;
  }

  async buscarItem(id: number) {
    const item = await this.siloRepository.buscarItem(id);
    if (!item) {
      throw new NotFoundException("Item nao encontrado.");
    }
    return item;
  }

  async atualizarItem(
    id: number,
    data: AtualizarItemInput,
    usuario: AuthContext,
    ip?: string,
  ) {
    const item = await this.buscarItem(id);
    const anterior = this.toPlain(item);
    await item.update(data);
    await this.registrarAuditoria(usuario, "ITEM_ATUALIZADO", item, ip, anterior);
    return item;
  }

  async removerItem(id: number, usuario: AuthContext, ip?: string) {
    const item = await this.buscarItem(id);
    const anterior = this.toPlain(item);
    await item.update({ ativo: false });
    await item.destroy();
    await this.registrarAuditoria(usuario, "ITEM_REMOVIDO", item, ip, anterior);
  }

  async listarTransportadoras(query: ListarCadastrosQueryDto) {
    const { page, limit, offset } = getPagination(query);
    const where = this.buildWhere(query, "ativa", ["nome", "documento"]);
    const { rows, count } = await this.siloRepository.listarTransportadoras({
      where,
      limit,
      offset,
      order: [["nome", "ASC"]],
    });

    return toPaginatedResponse(rows, count, page, limit);
  }

  async criarTransportadora(
    data: TransportadoraInput,
    usuario: AuthContext,
    ip?: string,
  ) {
    const transportadora = await this.siloRepository.criarTransportadora({
      ...data,
    });
    await this.registrarAuditoria(
      usuario,
      "TRANSPORTADORA_CRIADA",
      transportadora,
      ip,
    );
    return transportadora;
  }

  async buscarTransportadora(id: number) {
    const transportadora = await this.siloRepository.buscarTransportadora(id);
    if (!transportadora) {
      throw new NotFoundException("Transportadora nao encontrada.");
    }
    return transportadora;
  }

  async atualizarTransportadora(
    id: number,
    data: AtualizarTransportadoraInput,
    usuario: AuthContext,
    ip?: string,
  ) {
    const transportadora = await this.buscarTransportadora(id);
    const anterior = this.toPlain(transportadora);
    await transportadora.update(data);
    await this.registrarAuditoria(
      usuario,
      "TRANSPORTADORA_ATUALIZADA",
      transportadora,
      ip,
      anterior,
    );
    return transportadora;
  }

  async removerTransportadora(id: number, usuario: AuthContext, ip?: string) {
    const transportadora = await this.buscarTransportadora(id);
    const anterior = this.toPlain(transportadora);
    await transportadora.update({ ativa: false });
    await transportadora.destroy();
    await this.registrarAuditoria(
      usuario,
      "TRANSPORTADORA_REMOVIDA",
      transportadora,
      ip,
      anterior,
    );
  }

  async listarEmissores(query: ListarCadastrosQueryDto) {
    const { page, limit, offset } = getPagination(query);
    const where = this.buildWhere(query, "ativo", ["nome", "documento"]);
    const { rows, count } = await this.siloRepository.listarEmissores({
      where,
      limit,
      offset,
      order: [["nome", "ASC"]],
    });

    return toPaginatedResponse(rows, count, page, limit);
  }

  async criarEmissor(data: EmissorInput, usuario: AuthContext, ip?: string) {
    const emissor = await this.siloRepository.criarEmissor({ ...data });
    await this.registrarAuditoria(usuario, "EMISSOR_CRIADO", emissor, ip);
    return emissor;
  }

  async buscarEmissor(id: number) {
    const emissor = await this.siloRepository.buscarEmissor(id);
    if (!emissor) {
      throw new NotFoundException("Emissor nao encontrado.");
    }
    return emissor;
  }

  async atualizarEmissor(
    id: number,
    data: AtualizarEmissorInput,
    usuario: AuthContext,
    ip?: string,
  ) {
    const emissor = await this.buscarEmissor(id);
    const anterior = this.toPlain(emissor);
    await emissor.update(data);
    await this.registrarAuditoria(
      usuario,
      "EMISSOR_ATUALIZADO",
      emissor,
      ip,
      anterior,
    );
    return emissor;
  }

  async removerEmissor(id: number, usuario: AuthContext, ip?: string) {
    const emissor = await this.buscarEmissor(id);
    const anterior = this.toPlain(emissor);
    await emissor.update({ ativo: false });
    await emissor.destroy();
    await this.registrarAuditoria(usuario, "EMISSOR_REMOVIDO", emissor, ip, anterior);
  }

  async listarDepositos(query: ListarCadastrosQueryDto) {
    const { page, limit, offset } = getPagination(query);
    const where = this.buildWhere(query, "ativo", ["nome", "descricao"]);
    const { rows, count } = await this.siloRepository.listarDepositos({
      where,
      limit,
      offset,
      order: [["nome", "ASC"]],
    });

    return toPaginatedResponse(rows, count, page, limit);
  }

  async criarDeposito(data: DepositoInput, usuario: AuthContext, ip?: string) {
    const deposito = await this.siloRepository.criarDeposito({ ...data });
    await this.registrarAuditoria(usuario, "DEPOSITO_CRIADO", deposito, ip);
    return deposito;
  }

  async buscarDeposito(id: number) {
    const deposito = await this.siloRepository.buscarDeposito(id);
    if (!deposito) {
      throw new NotFoundException("Deposito nao encontrado.");
    }
    return deposito;
  }

  async atualizarDeposito(
    id: number,
    data: AtualizarDepositoInput,
    usuario: AuthContext,
    ip?: string,
  ) {
    const deposito = await this.buscarDeposito(id);
    const anterior = this.toPlain(deposito);
    await deposito.update(data);
    await this.registrarAuditoria(
      usuario,
      "DEPOSITO_ATUALIZADO",
      deposito,
      ip,
      anterior,
    );
    return deposito;
  }

  async removerDeposito(id: number, usuario: AuthContext, ip?: string) {
    const deposito = await this.buscarDeposito(id);
    const anterior = this.toPlain(deposito);
    await deposito.update({ ativo: false });
    await deposito.destroy();
    await this.registrarAuditoria(
      usuario,
      "DEPOSITO_REMOVIDO",
      deposito,
      ip,
      anterior,
    );
  }

  async listarDestinos(query: ListarCadastrosQueryDto) {
    const { page, limit, offset } = getPagination(query);
    const where = this.buildWhere(query, "ativo", ["nome", "descricao"]);
    const { rows, count } = await this.siloRepository.listarDestinos({
      where,
      limit,
      offset,
      order: [["nome", "ASC"]],
    });

    return toPaginatedResponse(rows, count, page, limit);
  }

  async criarDestino(data: DestinoInput, usuario: AuthContext, ip?: string) {
    const destino = await this.siloRepository.criarDestino({ ...data });
    await this.registrarAuditoria(usuario, "DESTINO_CRIADO", destino, ip);
    return destino;
  }

  async buscarDestino(id: number) {
    const destino = await this.siloRepository.buscarDestino(id);
    if (!destino) {
      throw new NotFoundException("Destino nao encontrado.");
    }
    return destino;
  }

  async atualizarDestino(
    id: number,
    data: AtualizarDestinoInput,
    usuario: AuthContext,
    ip?: string,
  ) {
    const destino = await this.buscarDestino(id);
    const anterior = this.toPlain(destino);
    await destino.update(data);
    await this.registrarAuditoria(
      usuario,
      "DESTINO_ATUALIZADO",
      destino,
      ip,
      anterior,
    );
    return destino;
  }

  async removerDestino(id: number, usuario: AuthContext, ip?: string) {
    const destino = await this.buscarDestino(id);
    const anterior = this.toPlain(destino);
    await destino.update({ ativo: false });
    await destino.destroy();
    await this.registrarAuditoria(usuario, "DESTINO_REMOVIDO", destino, ip, anterior);
  }

  async listarSeriesRomaneio(query: ListarCadastrosQueryDto) {
    const { page, limit, offset } = getPagination(query);
    const where: Record<string, unknown> = {};

    if (typeof query.ativo === "boolean") {
      where.ativa = query.ativo;
    }

    if (query.search) {
      where.numero_serie = { [Op.like]: `%${query.search}%` };
    }

    const { rows, count } = await this.siloRepository.listarSeriesRomaneio({
      where,
      limit,
      offset,
      order: [["iniciada_em", "DESC"]],
    });

    return toPaginatedResponse(rows, count, page, limit);
  }

  async criarNovaSerieRomaneio(
    data: SerieRomaneioInput,
    usuario: AuthContext,
    ip?: string,
  ) {
    const transaction = await this.siloRepository.criarTransacao();
    let serie: SerieRomaneio;

    try {
      await this.siloRepository.encerrarSeriesAtivas(transaction);
      serie = await this.siloRepository.criarSerieRomaneio(
        {
          numero_serie: data.numero_serie,
          proximo_numero: data.proximo_numero || 1,
          ativa: true,
          iniciada_em: new Date(),
          criada_por: usuario.usuario_id,
          motivo_abertura: data.motivo_abertura || null,
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
      acao: "SERIE_ROMANEIO_CRIADA",
      recurso: "SERIE_ROMANEIO",
      recurso_id: serie!.id_serie_romaneio,
      valor_novo: this.toPlain(serie!),
      justificativa: data.motivo_abertura || null,
      ip,
    });

    return serie!;
  }

  async validarReferenciasBasicas(
    data: {
      conta_produto_id?: number | null;
      item_id?: number | null;
      transportadora_id?: number | null;
      emissor_id?: number | null;
      deposito_id?: number | null;
      destino_id?: number | null;
    },
    transaction?: Transaction,
  ) {
    if (data.conta_produto_id) {
      await this.garantirExiste(
        this.siloRepository.buscarContaProduto(data.conta_produto_id, transaction),
        "Conta de produto nao encontrada.",
      );
    }

    if (data.item_id) {
      await this.garantirExiste(
        this.siloRepository.buscarItem(data.item_id, transaction),
        "Item nao encontrado.",
      );
    }

    if (data.transportadora_id) {
      await this.garantirExiste(
        this.siloRepository.buscarTransportadora(
          data.transportadora_id,
          transaction,
        ),
        "Transportadora nao encontrada.",
      );
    }

    if (data.emissor_id) {
      await this.garantirExiste(
        this.siloRepository.buscarEmissor(data.emissor_id, transaction),
        "Emissor nao encontrado.",
      );
    }

    if (data.deposito_id) {
      await this.garantirExiste(
        this.siloRepository.buscarDeposito(data.deposito_id, transaction),
        "Deposito nao encontrado.",
      );
    }

    if (data.destino_id) {
      await this.garantirExiste(
        this.siloRepository.buscarDestino(data.destino_id, transaction),
        "Destino nao encontrado.",
      );
    }
  }

  private buildWhere(
    query: ListarCadastrosQueryDto,
    ativoField: "ativo" | "ativa",
    searchFields: string[],
  ) {
    const where: Record<string, unknown> = {};

    if (typeof query.ativo === "boolean") {
      where[ativoField] = query.ativo;
    }

    if (query.search) {
      where[Op.or as unknown as string] = searchFields.map((field) => ({
        [field]: { [Op.like]: `%${query.search}%` },
      }));
    }

    return where;
  }

  private async garantirExiste<T>(promise: Promise<T | null>, message: string) {
    const result = await promise;
    if (!result) {
      throw new NotFoundException(message);
    }
  }

  private async registrarAuditoria(
    usuario: AuthContext,
    acao: string,
    entity:
      | ContaProduto
      | Item
      | Transportadora
      | Emissor
      | Deposito
      | Destino,
    ip?: string,
    valorAnterior?: object | null,
  ) {
    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao,
      recurso: entity.constructor.name,
      recurso_id: Number(entity.get(this.getPkName(entity))),
      valor_anterior: valorAnterior || null,
      valor_novo: this.toPlain(entity),
      ip,
    });
  }

  private getPkName(entity: { constructor: { name: string } }) {
    const map: Record<string, string> = {
      ContaProduto: "id_conta_produto",
      Item: "id_item",
      Transportadora: "id_transportadora",
      Emissor: "id_emissor",
      Deposito: "id_deposito",
      Destino: "id_destino",
    };
    return map[entity.constructor.name] || "id";
  }

  private toPlain(entity: { get: (options: { plain: true }) => object }) {
    return entity.get({ plain: true });
  }
}
