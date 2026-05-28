import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op } from "sequelize";
import { AuditService } from "../audit/audit.service";
import { AuthContext } from "../auth-client/auth.types";
import { EntidadeTipo } from "./entidade-tipo.model";
import { Entidade } from "./entidade.model";
import {
  AtualizarEntidadeInput,
  EntidadeInput,
  ListarEntidadesQuery,
} from "./entidades.schema";

@Injectable()
export class EntidadesService {
  constructor(
    @InjectModel(Entidade) private readonly entidadeModel: typeof Entidade,
    @InjectModel(EntidadeTipo)
    private readonly entidadeTipoModel: typeof EntidadeTipo,
    private readonly auditService: AuditService,
  ) {}

  async listar(query: ListarEntidadesQuery) {
    const where: Record<string, unknown> = {};

    if (query.termo) {
      where[Op.or as unknown as string] = [
        { nome: { [Op.like]: `%${query.termo}%` } },
        { cpf_cnpj: { [Op.like]: `%${query.termo}%` } },
      ];
    }

    if (typeof query.ativo === "boolean") {
      where.ativo = query.ativo;
    }

    const entidades = await this.entidadeModel.findAll({
      where,
      include: [
        {
          model: EntidadeTipo,
          as: "tipos",
          attributes: ["tipo"],
          where: query.tipo ? { tipo: query.tipo } : undefined,
          required: Boolean(query.tipo),
        },
      ],
      order: [["nome", "ASC"]],
    });

    return entidades.map((entidade) => this.toResponse(entidade));
  }

  async criar(data: EntidadeInput, usuario: AuthContext, ip?: string) {
    const transaction = await this.entidadeModel.sequelize!.transaction();

    try {
      const entidade = await this.entidadeModel.create(this.getDados(data), {
        transaction,
      });
      await this.entidadeTipoModel.bulkCreate(
        this.getTipos(data.tipos, entidade.id_entidade),
        { transaction },
      );
      await transaction.commit();

      const criada = await this.buscarPorId(entidade.id_entidade);
      await this.auditService.registrar({
        conta_id: usuario.conta_id,
        usuario_id: usuario.usuario_id,
        acao: "ENTIDADE_CRIADA",
        recurso: "ENTIDADE",
        recurso_id: entidade.id_entidade,
        valor_novo: criada,
        ip,
      });

      return criada;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async buscarPorId(id_entidade: number) {
    const entidade = await this.entidadeModel.findByPk(id_entidade, {
      include: [{ model: EntidadeTipo, as: "tipos", attributes: ["tipo"] }],
    });

    if (!entidade) {
      throw new NotFoundException("Entidade nao encontrada.");
    }

    return this.toResponse(entidade);
  }

  async atualizar(
    id_entidade: number,
    data: AtualizarEntidadeInput,
    usuario: AuthContext,
    ip?: string,
  ) {
    const entidade = await this.entidadeModel.findByPk(id_entidade);

    if (!entidade) {
      throw new NotFoundException("Entidade nao encontrada.");
    }

    const anterior = await this.buscarPorId(id_entidade);
    const transaction = await this.entidadeModel.sequelize!.transaction();

    try {
      await entidade.update(this.getDados(data), { transaction });

      if (data.tipos) {
        await this.entidadeTipoModel.destroy({
          where: { entidade_id: id_entidade },
          transaction,
        });
        await this.entidadeTipoModel.bulkCreate(
          this.getTipos(data.tipos, id_entidade),
          { transaction },
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    const atualizada = await this.buscarPorId(id_entidade);
    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "ENTIDADE_ATUALIZADA",
      recurso: "ENTIDADE",
      recurso_id: id_entidade,
      valor_anterior: anterior,
      valor_novo: atualizada,
      ip,
    });

    return atualizada;
  }

  async remover(id_entidade: number, usuario: AuthContext, ip?: string) {
    const entidade = await this.entidadeModel.findByPk(id_entidade);

    if (!entidade) {
      throw new NotFoundException("Entidade nao encontrada.");
    }

    const anterior = await this.buscarPorId(id_entidade);
    await entidade.update({ ativo: false });
    await entidade.destroy();

    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "ENTIDADE_REMOVIDA",
      recurso: "ENTIDADE",
      recurso_id: id_entidade,
      valor_anterior: anterior,
      ip,
    });
  }

  private getDados(data: Partial<EntidadeInput>) {
    const { tipos, ...dados } = data;
    return dados;
  }

  private getTipos(tipos: EntidadeInput["tipos"], entidade_id: number) {
    return Array.from(new Set(tipos)).map((tipo) => ({ entidade_id, tipo }));
  }

  private toResponse(entidade: Entidade) {
    const plain = entidade.get({ plain: true }) as Record<string, unknown> & {
      tipos?: Array<{ tipo: string }>;
    };

    return {
      ...plain,
      tipos: plain.tipos?.map((item) => item.tipo) || [],
    };
  }
}
