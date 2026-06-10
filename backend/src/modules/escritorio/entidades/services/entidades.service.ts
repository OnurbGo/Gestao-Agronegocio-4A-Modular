import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Op } from "sequelize";
import { AuditService } from "../../auditoria/services/audit.service";
import { AuthContext } from "../../auth-client/types/auth.types";
import {
  getPagination,
  toPaginatedResponse,
} from "../../shared/utils/pagination";
import { EntidadeTipo } from "../entities/entidade-tipo.entity";
import { Entidade } from "../entities/entidade.entity";
import {
  AtualizarEntidadeInput,
  EntidadeInput,
  ListarEntidadesQuery,
} from "../dto/entidades.dto";
import { EntidadesRepository } from "../repositories/entidades.repository";
import {
  TipoPessoa,
  isValidDocumentoPessoa,
} from "../utils/documento-pessoa.utils";

@Injectable()
export class EntidadesService {
  constructor(
    private readonly entidadesRepository: EntidadesRepository,
    private readonly auditService: AuditService,
  ) {}

  async listar(query: ListarEntidadesQuery) {
    const where: Record<string, unknown> = {};
    const termo = query.search || query.termo;
    const { page, limit, offset } = getPagination(query);

    if (termo) {
      where[Op.or as unknown as string] = [
        { nome: { [Op.like]: `%${termo}%` } },
        { cpf_cnpj: { [Op.like]: `%${termo}%` } },
      ];
    }

    if (typeof query.ativo === "boolean") {
      where.ativo = query.ativo;
    }

    if (query.tipo_pessoa) {
      where.tipo_pessoa = query.tipo_pessoa;
    }

    const { rows, count } = await this.entidadesRepository.listarPaginado({
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
      distinct: true,
      limit,
      offset,
      order: [["nome", "ASC"]],
    });

    return toPaginatedResponse(
      rows.map((entidade) => this.toResponse(entidade)),
      count,
      page,
      limit,
    );
  }

  async criar(data: EntidadeInput, usuario: AuthContext, ip?: string) {
    const transaction = await this.entidadesRepository.criarTransacao();
    let entidadeId = 0;

    try {
      const entidade = await this.entidadesRepository.criar(
        this.getDados(data),
        transaction,
      );
      await this.entidadesRepository.substituirTipos(
        entidade.id_entidade,
        data.tipos,
        transaction,
      );
      await transaction.commit();
      entidadeId = entidade.id_entidade;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    const criada = await this.buscarPorId(entidadeId);
    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "ENTIDADE_CRIADA",
      recurso: "ENTIDADE",
      recurso_id: entidadeId,
      valor_novo: criada,
      ip,
    });

    return criada;
  }

  async buscarPorId(id_entidade: number) {
    const entidade = await this.entidadesRepository.buscarPorId(id_entidade, true);

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
    const entidade = await this.entidadesRepository.buscarPorId(id_entidade);

    if (!entidade) {
      throw new NotFoundException("Entidade nao encontrada.");
    }

    const anterior = await this.buscarPorId(id_entidade);
    const transaction = await this.entidadesRepository.criarTransacao();

    try {
      await this.entidadesRepository.atualizar(
        entidade,
        this.getDados(data, entidade),
        transaction,
      );

      if (data.tipos) {
        await this.entidadesRepository.substituirTipos(
          id_entidade,
          data.tipos,
          transaction,
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
    const entidade = await this.entidadesRepository.buscarPorId(id_entidade);

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

  private getDados(data: Partial<EntidadeInput>, entidadeAtual?: Entidade) {
    const { tipos, ...dados } = data;
    const tipoPessoa = (dados.tipo_pessoa ||
      entidadeAtual?.tipo_pessoa) as TipoPessoa | undefined;
    const cpfCnpj = dados.cpf_cnpj ?? entidadeAtual?.cpf_cnpj;
    const deveValidarDocumento =
      !entidadeAtual ||
      Object.prototype.hasOwnProperty.call(dados, "cpf_cnpj") ||
      Object.prototype.hasOwnProperty.call(dados, "tipo_pessoa");

    if (deveValidarDocumento) {
      this.validarDocumentoPessoa(cpfCnpj, tipoPessoa);
    }

    if (
      tipoPessoa === "JURIDICA" &&
      (dados.tipo_pessoa === "JURIDICA" ||
        Object.prototype.hasOwnProperty.call(dados, "rg") ||
        Object.prototype.hasOwnProperty.call(dados, "data_nascimento"))
    ) {
      dados.rg = null;
      dados.data_nascimento = null;
    }

    return dados;
  }

  private validarDocumentoPessoa(
    cpfCnpj: unknown,
    tipoPessoa: TipoPessoa | undefined,
  ) {
    if (!tipoPessoa || !isValidDocumentoPessoa(cpfCnpj, tipoPessoa)) {
      throw new BadRequestException(
        tipoPessoa === "JURIDICA"
          ? "CNPJ invalido para Pessoa Juridica."
          : "CPF invalido para Pessoa Fisica.",
      );
    }
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

