import { Op } from "sequelize";
import sequelize from "../../../config/database";
import ApiError from "../../../shared/errors/api-error";
import AuditoriaService from "../../../core/auditoria/auditoria.service";
import EntidadeTipo from "./entidade-tipo.model";
import Entidade from "./entidade.model";
import {
  AtualizarEntidadeInput,
  EntidadeInput,
  ListarEntidadesQuery,
} from "./entidade.schema";

type UsuarioLogado = Express.Request["usuario"];

class EntidadeService {
  async criar(data: EntidadeInput, usuarioLogado: UsuarioLogado, ip?: string) {
    await this.validarCpfCnpjDisponivel(data.cpf_cnpj);

    const entidade = await sequelize.transaction(async (transaction) => {
      const novaEntidade = await Entidade.create(this.getDadosEntidade(data), {
        transaction,
      });

      await EntidadeTipo.bulkCreate(
        this.getTipos(data.tipos, novaEntidade.get("id_entidade") as number),
        { transaction },
      );

      return novaEntidade;
    });

    const entidadeCompleta = await this.buscarPorId(
      entidade.get("id_entidade") as number,
    );

    await AuditoriaService.registrar({
      usuario_id: usuarioLogado?.id_usuario,
      acao: "ENTIDADE_CRIADA",
      recurso: "ENTIDADE",
      recurso_id: entidade.get("id_entidade") as number,
      valor_novo: entidadeCompleta,
      ip,
    });

    return entidadeCompleta;
  }

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

    const entidades = await Entidade.findAll({
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

  async buscarPorId(id_entidade: number) {
    const entidade = await Entidade.findByPk(id_entidade, {
      include: [
        {
          model: EntidadeTipo,
          as: "tipos",
          attributes: ["tipo"],
        },
      ],
    });

    if (!entidade) {
      throw new ApiError("Entidade não encontrada.", 404);
    }

    return this.toResponse(entidade);
  }

  async atualizar(
    id_entidade: number,
    data: AtualizarEntidadeInput,
    usuarioLogado: UsuarioLogado,
    ip?: string,
  ) {
    const entidade = await this.buscarModelPorId(id_entidade);
    const valorAnterior = await this.buscarPorId(id_entidade);

    if (data.cpf_cnpj && data.cpf_cnpj !== entidade.get("cpf_cnpj")) {
      await this.validarCpfCnpjDisponivel(data.cpf_cnpj, id_entidade);
    }

    await sequelize.transaction(async (transaction) => {
      await entidade.update(this.getDadosEntidade(data), { transaction });

      if (data.tipos) {
        await EntidadeTipo.destroy({
          where: { entidade_id: id_entidade },
          transaction,
        });
        await EntidadeTipo.bulkCreate(this.getTipos(data.tipos, id_entidade), {
          transaction,
        });
      }
    });

    const entidadeAtualizada = await this.buscarPorId(id_entidade);

    await AuditoriaService.registrar({
      usuario_id: usuarioLogado?.id_usuario,
      acao: "ENTIDADE_ATUALIZADA",
      recurso: "ENTIDADE",
      recurso_id: id_entidade,
      valor_anterior: valorAnterior,
      valor_novo: entidadeAtualizada,
      ip,
    });

    return entidadeAtualizada;
  }

  async remover(
    id_entidade: number,
    usuarioLogado: UsuarioLogado,
    ip?: string,
  ) {
    const entidade = await this.buscarModelPorId(id_entidade);
    const valorAnterior = await this.buscarPorId(id_entidade);

    await entidade.update({ ativo: false });
    await entidade.destroy();

    await AuditoriaService.registrar({
      usuario_id: usuarioLogado?.id_usuario,
      acao: "ENTIDADE_REMOVIDA",
      recurso: "ENTIDADE",
      recurso_id: id_entidade,
      valor_anterior: valorAnterior,
      ip,
    });
  }

  private async buscarModelPorId(id_entidade: number) {
    const entidade = await Entidade.findByPk(id_entidade);

    if (!entidade) {
      throw new ApiError("Entidade não encontrada.", 404);
    }

    return entidade;
  }

  private async validarCpfCnpjDisponivel(
    cpf_cnpj: string,
    ignorarEntidadeId?: number,
  ) {
    const entidade = await Entidade.findOne({
      where: { cpf_cnpj },
      paranoid: false,
    });

    if (
      entidade &&
      (!ignorarEntidadeId ||
        (entidade.get("id_entidade") as number) !== ignorarEntidadeId)
    ) {
      throw new ApiError("Já existe uma entidade com este CPF/CNPJ.", 400);
    }
  }

  private getDadosEntidade(data: Partial<EntidadeInput>) {
    const { tipos, ...dados } = data;
    return dados;
  }

  private getTipos(tipos: EntidadeInput["tipos"], entidade_id: number) {
    return Array.from(new Set(tipos)).map((tipo) => ({
      entidade_id,
      tipo,
    }));
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

export default new EntidadeService();
