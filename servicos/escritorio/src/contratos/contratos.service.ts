import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op } from "sequelize";
import { AuditService } from "../audit/audit.service";
import { AuthContext } from "../auth-client/auth.types";
import { Entidade } from "../entidades/entidade.model";
import { Imovel } from "../imoveis/imovel.model";
import { Contrato } from "./contrato.model";
import {
  AtualizarContratoInput,
  ContratoInput,
  ListarContratosQuery,
} from "./contratos.schema";

@Injectable()
export class ContratosService {
  constructor(
    @InjectModel(Contrato) private readonly contratoModel: typeof Contrato,
    @InjectModel(Entidade) private readonly entidadeModel: typeof Entidade,
    @InjectModel(Imovel) private readonly imovelModel: typeof Imovel,
    private readonly auditService: AuditService,
  ) {}

  listar(query: ListarContratosQuery) {
    const where: Record<string, unknown> = {};

    if (query.termo) {
      where[Op.or as unknown as string] = [
        { numero: { [Op.like]: `%${query.termo}%` } },
        { safra: { [Op.like]: `%${query.termo}%` } },
        { produto: { [Op.like]: `%${query.termo}%` } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    if (typeof query.ativo === "boolean") {
      where.ativo = query.ativo;
    }

    return this.contratoModel.findAll({
      where,
      include: [
        { model: Entidade, as: "entidade" },
        { model: Imovel, as: "imovel" },
      ],
      order: [["data_inicial", "DESC"]],
    });
  }

  async criar(data: ContratoInput, usuario: AuthContext, ip?: string) {
    await this.validarRelacionamentos(data.entidade_id, data.imovel_id);
    this.validarPeriodo(data.data_inicial, data.data_final);

    const contrato = await this.contratoModel.create(this.getDados(data));
    const criado = await this.buscarPorId(contrato.id_contrato);

    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "CONTRATO_CRIADO",
      recurso: "CONTRATO",
      recurso_id: contrato.id_contrato,
      valor_novo: criado.get({ plain: true }),
      ip,
    });

    return criado;
  }

  async buscarPorId(id_contrato: number) {
    const contrato = await this.contratoModel.findByPk(id_contrato, {
      include: [
        { model: Entidade, as: "entidade" },
        { model: Imovel, as: "imovel" },
      ],
    });

    if (!contrato) {
      throw new NotFoundException("Contrato nao encontrado.");
    }

    return contrato;
  }

  async atualizar(
    id_contrato: number,
    data: AtualizarContratoInput,
    usuario: AuthContext,
    ip?: string,
  ) {
    const contrato = await this.buscarPorId(id_contrato);
    const anterior = contrato.get({ plain: true });

    await this.validarRelacionamentos(data.entidade_id, data.imovel_id);
    this.validarPeriodo(
      data.data_inicial || String(contrato.data_inicial),
      data.data_final || String(contrato.data_final),
    );

    await contrato.update(this.getDados(data));
    const atualizado = await this.buscarPorId(id_contrato);

    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "CONTRATO_ATUALIZADO",
      recurso: "CONTRATO",
      recurso_id: id_contrato,
      valor_anterior: anterior,
      valor_novo: atualizado.get({ plain: true }),
      ip,
    });

    return atualizado;
  }

  async remover(id_contrato: number, usuario: AuthContext, ip?: string) {
    const contrato = await this.buscarPorId(id_contrato);
    const anterior = contrato.get({ plain: true });

    await contrato.update({ ativo: false });
    await contrato.destroy();

    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "CONTRATO_REMOVIDO",
      recurso: "CONTRATO",
      recurso_id: id_contrato,
      valor_anterior: anterior,
      ip,
    });
  }

  private async validarRelacionamentos(
    entidade_id?: number,
    imovel_id?: number | null,
  ) {
    if (entidade_id) {
      const entidade = await this.entidadeModel.findByPk(entidade_id);

      if (!entidade) {
        throw new NotFoundException("Entidade do contrato nao encontrada.");
      }
    }

    if (imovel_id) {
      const imovel = await this.imovelModel.findByPk(imovel_id);

      if (!imovel) {
        throw new NotFoundException("Imovel do contrato nao encontrado.");
      }
    }
  }

  private validarPeriodo(dataInicial: string, dataFinal: string) {
    if (new Date(dataInicial) > new Date(dataFinal)) {
      throw new BadRequestException("Data inicial deve ser anterior a data final.");
    }
  }

  private getDados(data: Partial<ContratoInput>) {
    const dados: Record<string, unknown> = { ...data };

    if ("quantidade_prevista" in data) {
      dados.quantidade_prevista =
        data.quantidade_prevista === undefined
          ? undefined
          : Number(data.quantidade_prevista).toFixed(2);
    }

    return dados;
  }
}
