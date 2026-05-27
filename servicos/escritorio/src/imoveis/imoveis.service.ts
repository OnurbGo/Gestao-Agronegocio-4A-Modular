import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op } from "sequelize";
import { AuditService } from "../audit/audit.service";
import { AuthContext } from "../auth-client/auth.types";
import { Entidade } from "../entidades/entidade.model";
import {
  AtualizarImovelInput,
  ImovelInput,
  ListarImoveisQuery,
} from "./imoveis.schema";
import { Imovel } from "./imovel.model";

@Injectable()
export class ImoveisService {
  constructor(
    @InjectModel(Imovel) private readonly imovelModel: typeof Imovel,
    @InjectModel(Entidade) private readonly entidadeModel: typeof Entidade,
    private readonly auditService: AuditService,
  ) {}

  async listar(query: ListarImoveisQuery) {
    const where: Record<string, unknown> = {};

    if (query.termo) {
      where[Op.or as unknown as string] = [
        { nome: { [Op.like]: `%${query.termo}%` } },
        { codigo: { [Op.like]: `%${query.termo}%` } },
        { matricula: { [Op.like]: `%${query.termo}%` } },
        { cidade: { [Op.like]: `%${query.termo}%` } },
      ];
    }

    if (typeof query.ativo === "boolean") {
      where.ativo = query.ativo;
    }

    return this.imovelModel.findAll({
      where,
      include: [{ model: Entidade, as: "proprietario" }],
      order: [["nome", "ASC"]],
    });
  }

  async criar(data: ImovelInput, usuario: AuthContext, ip?: string) {
    await this.validarProprietario(data.proprietario_entidade_id);
    const imovel = await this.imovelModel.create(this.getDados(data));
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
    const imovel = await this.imovelModel.findByPk(id_imovel, {
      include: [{ model: Entidade, as: "proprietario" }],
    });

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
    await this.validarProprietario(data.proprietario_entidade_id);
    const imovel = await this.buscarPorId(id_imovel);
    const anterior = imovel.get({ plain: true });

    await imovel.update(this.getDados(data));
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

  private async validarProprietario(id_entidade?: number | null) {
    if (!id_entidade) {
      return;
    }

    const proprietario = await this.entidadeModel.findByPk(id_entidade);

    if (!proprietario) {
      throw new NotFoundException("Proprietario nao encontrado.");
    }
  }

  private getDados(data: Partial<ImovelInput>) {
    const dados: Record<string, unknown> = { ...data };

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
