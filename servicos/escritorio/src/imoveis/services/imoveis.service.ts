import { Injectable, NotFoundException } from "@nestjs/common";
import { Op } from "sequelize";
import { AuditService } from "../../audit/services/audit.service";
import { AuthContext } from "../../auth-client/types/auth.types";
import { Entidade } from "../../entidades/entities/entidade.entity";
import {
  getPagination,
  toPaginatedResponse,
} from "../../shared/utils/pagination";
import {
  AtualizarImovelInput,
  ImovelInput,
  ListarImoveisQuery,
} from "../dto/imoveis.dto";
import { ImoveisRepository } from "../repositories/imoveis.repository";

@Injectable()
export class ImoveisService {
  constructor(
    private readonly imoveisRepository: ImoveisRepository,
    private readonly auditService: AuditService,
  ) {}

  async listar(query: ListarImoveisQuery) {
    const where: Record<string, unknown> = {};
    const termo = query.search || query.termo;
    const { page, limit, offset } = getPagination(query);

    if (termo) {
      where[Op.or as unknown as string] = [
        { nome: { [Op.like]: `%${termo}%` } },
        { codigo: { [Op.like]: `%${termo}%` } },
        { matricula: { [Op.like]: `%${termo}%` } },
        { cidade: { [Op.like]: `%${termo}%` } },
        { municipio: { [Op.like]: `%${termo}%` } },
      ];
    }

    if (query.municipio) {
      where.municipio = { [Op.like]: `%${query.municipio}%` };
    }

    if (query.lote) {
      where.lote = { [Op.like]: `%${query.lote}%` };
    }

    if (query.colonia) {
      where.colonia = { [Op.like]: `%${query.colonia}%` };
    }

    if (typeof query.ativo === "boolean") {
      where.ativo = query.ativo;
    }

    const { rows, count } = await this.imoveisRepository.listarPaginado({
      where,
      include: [{ model: Entidade, as: "proprietarios" }],
      distinct: true,
      limit,
      offset,
      order: [["nome", "ASC"]],
    });

    return toPaginatedResponse(rows, count, page, limit);
  }

  async criar(data: ImovelInput, usuario: AuthContext, ip?: string) {
    const imovel = await this.imoveisRepository.criar(this.getDados(data));

    await this.imoveisRepository.sincronizarProprietarios(
      imovel.id_imovel,
      data.proprietarios_ids ?? [],
    );

    const criado = await this.buscarPorId(imovel.id_imovel);

    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "IMOVEL_CRIADO",
      recurso: "IMOVEL",
      recurso_id: imovel.id_imovel,
      valor_novo: criado.get({ plain: true }),
      ip,
    });

    return criado;
  }

  async buscarPorId(id_imovel: number) {
    const imovel = await this.imoveisRepository.buscarPorId(id_imovel);

    if (!imovel) {
      throw new NotFoundException("Imovel nao encontrado.");
    }

    return imovel;
  }

  async atualizar(
    id_imovel: number,
    data: AtualizarImovelInput,
    usuario: AuthContext,
    ip?: string,
  ) {
    const imovel = await this.buscarPorId(id_imovel);
    const anterior = imovel.get({ plain: true });

    await imovel.update(this.getDados(data));

    if (data.proprietarios_ids !== undefined) {
      await this.imoveisRepository.sincronizarProprietarios(
        id_imovel,
        data.proprietarios_ids,
      );
    }

    const atualizado = await this.buscarPorId(id_imovel);

    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "IMOVEL_ATUALIZADO",
      recurso: "IMOVEL",
      recurso_id: id_imovel,
      valor_anterior: anterior,
      valor_novo: atualizado.get({ plain: true }),
      ip,
    });

    return atualizado;
  }

  async remover(id_imovel: number, usuario: AuthContext, ip?: string) {
    const imovel = await this.buscarPorId(id_imovel);
    const anterior = imovel.get({ plain: true });

    await this.imoveisRepository.sincronizarProprietarios(id_imovel, []);
    await imovel.update({ ativo: false });
    await imovel.destroy();

    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "IMOVEL_REMOVIDO",
      recurso: "IMOVEL",
      recurso_id: id_imovel,
      valor_anterior: anterior,
      ip,
    });
  }

  private getDados(data: Partial<ImovelInput>) {
    const { proprietarios_ids: _ids, ...rest } = data as ImovelInput & {
      proprietarios_ids?: number[];
    };
    const dados: Record<string, unknown> = { ...rest };

    if ("area_total" in data) {
      dados.area_total =
        data.area_total === null || data.area_total === undefined
          ? null
          : Number(data.area_total).toFixed(2);
    }

    if ("area_agricultavel" in data) {
      dados.area_agricultavel =
        data.area_agricultavel === null ||
        data.area_agricultavel === undefined
          ? null
          : Number(data.area_agricultavel).toFixed(2);
    }

    return dados;
  }
}
