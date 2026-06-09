import { Injectable, NotFoundException } from "@nestjs/common";
import { AuditService } from "../auditoria/services/audit.service";
import { AuthContext } from "../auth-client/types/auth.types";
import {
  DadosSaidaPesagemInput,
  ListarDadosSaidaQuery,
} from "../dto/dados-saida.dto";
import { ClassificacaoPesagem } from "../entities/classificacao-pesagem.entity";
import { DadosSaidaPesagem } from "../entities/dados-saida-pesagem.entity";
import { LoteOperacional } from "../entities/lote-operacional.entity";
import { Pesagem } from "../entities/pesagem.entity";
import { decimal } from "../helpers/number.utils";
import { SiloRepository } from "../repositories/silo.repository";
import {
  getPagination,
  toPaginatedResponse,
} from "../../shared/utils/pagination";
import { PesagensService } from "./pesagens.service";

const DADOS_SAIDA_INCLUDES = [
  {
    model: Pesagem,
    as: "pesagem",
    include: [{ model: ClassificacaoPesagem, as: "classificacao" }],
  },
  { model: LoteOperacional, as: "lote_operacional" },
];

@Injectable()
export class DadosSaidaService {
  constructor(
    private readonly siloRepository: SiloRepository,
    private readonly pesagensService: PesagensService,
    private readonly auditService: AuditService,
  ) {}

  async listar(query: ListarDadosSaidaQuery) {
    const { page, limit, offset } = getPagination(query);
    const where: Record<string, unknown> = {};

    if (query.pesagem_id) where.pesagem_id = query.pesagem_id;
    if (query.lote_operacional_id) where.lote_operacional_id = query.lote_operacional_id;

    const { rows, count } = await this.siloRepository.listarDadosSaida({
      where,
      include: DADOS_SAIDA_INCLUDES,
      distinct: true,
      limit,
      offset,
      order: [["id_dados_saida_pesagem", "DESC"]],
    });

    return toPaginatedResponse(rows, count, page, limit);
  }

  async salvarPorPesagem(
    pesagemId: number,
    data: DadosSaidaPesagemInput,
    usuario: AuthContext,
    ip?: string,
  ) {
    const pesagem = await this.pesagensService.buscarPorId(pesagemId);
    const existente = await this.siloRepository.buscarDadosSaidaPorPesagem(
      pesagemId,
    );
    const anterior = existente ? this.toPlain(existente) : null;
    const dados = this.normalizarDados(data);
    let registro: DadosSaidaPesagem;

    if (existente) {
      await existente.update({ ...dados, atualizado_por: usuario.usuario_id });
      registro = existente;
    } else {
      registro = await this.siloRepository.criarDadosSaida({
        ...dados,
        pesagem_id: pesagem.id_pesagem,
        lote_operacional_id: pesagem.lote_operacional_id,
        criado_por: usuario.usuario_id,
        atualizado_por: usuario.usuario_id,
      });
    }

    const atualizado = await this.buscarPorId(registro.id_dados_saida_pesagem);
    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: anterior ? "DADOS_SAIDA_ATUALIZADOS" : "DADOS_SAIDA_CRIADOS",
      recurso: "DADOS_SAIDA_PESAGEM",
      recurso_id: registro.id_dados_saida_pesagem,
      valor_anterior: anterior,
      valor_novo: this.toPlain(atualizado),
      ip,
    });

    return atualizado;
  }

  async buscarPorId(id: number) {
    const dados = await this.siloRepository.buscarDadosSaida(id, {
      include: DADOS_SAIDA_INCLUDES,
    });

    if (!dados) {
      throw new NotFoundException("Dados de saida da pesagem nao encontrados.");
    }

    return dados;
  }

  async atualizar(
    id: number,
    data: DadosSaidaPesagemInput,
    usuario: AuthContext,
    ip?: string,
  ) {
    const dados = await this.buscarPorId(id);
    const anterior = this.toPlain(dados);
    await dados.update({
      ...this.normalizarDados(data),
      atualizado_por: usuario.usuario_id,
    });
    const atualizado = await this.buscarPorId(id);
    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "DADOS_SAIDA_ATUALIZADOS",
      recurso: "DADOS_SAIDA_PESAGEM",
      recurso_id: id,
      valor_anterior: anterior,
      valor_novo: this.toPlain(atualizado),
      ip,
    });

    return atualizado;
  }

  private normalizarDados(data: DadosSaidaPesagemInput) {
    return {
      ...data,
      peso_nf_kg:
        data.peso_nf_kg === undefined || data.peso_nf_kg === null
          ? data.peso_nf_kg
          : decimal(data.peso_nf_kg),
      peso_nf_sacas:
        data.peso_nf_sacas === undefined || data.peso_nf_sacas === null
          ? data.peso_nf_sacas
          : decimal(data.peso_nf_sacas),
      valor_total:
        data.valor_total === undefined || data.valor_total === null
          ? data.valor_total
          : decimal(data.valor_total, 2),
      senar_valor:
        data.senar_valor === undefined || data.senar_valor === null
          ? data.senar_valor
          : decimal(data.senar_valor, 2),
      funrural_valor:
        data.funrural_valor === undefined || data.funrural_valor === null
          ? data.funrural_valor
          : decimal(data.funrural_valor, 2),
      icms_valor:
        data.icms_valor === undefined || data.icms_valor === null
          ? data.icms_valor
          : decimal(data.icms_valor, 2),
      frete_valor:
        data.frete_valor === undefined || data.frete_valor === null
          ? data.frete_valor
          : decimal(data.frete_valor, 2),
      corretagem_valor:
        data.corretagem_valor === undefined || data.corretagem_valor === null
          ? data.corretagem_valor
          : decimal(data.corretagem_valor, 2),
      royalties_valor:
        data.royalties_valor === undefined || data.royalties_valor === null
          ? data.royalties_valor
          : decimal(data.royalties_valor, 2),
    };
  }

  private toPlain(entity: { get: (options: { plain: true }) => object }) {
    return entity.get({ plain: true });
  }
}
