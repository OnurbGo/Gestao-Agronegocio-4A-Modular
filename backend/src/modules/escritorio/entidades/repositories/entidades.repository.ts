import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { FindAndCountOptions, Transaction } from "sequelize";
import { Entidade } from "../entities/entidade.entity";
import { EntidadeTipo } from "../entities/entidade-tipo.entity";

@Injectable()
export class EntidadesRepository {
  constructor(
    @InjectModel(Entidade) private readonly entidadeModel: typeof Entidade,
    @InjectModel(EntidadeTipo)
    private readonly entidadeTipoModel: typeof EntidadeTipo,
  ) {}

  criarTransacao() {
    return this.entidadeModel.sequelize!.transaction();
  }

  listarPaginado(options: FindAndCountOptions) {
    return this.entidadeModel.findAndCountAll(options);
  }

  buscarPorId(id_entidade: number, incluirTipos = false) {
    return this.entidadeModel.findByPk(id_entidade, {
      include: incluirTipos
        ? [{ model: EntidadeTipo, as: "tipos", attributes: ["tipo"] }]
        : undefined,
    });
  }

  criar(data: Record<string, unknown>, transaction?: Transaction) {
    return this.entidadeModel.create(data, { transaction });
  }

  atualizar(
    entidade: Entidade,
    data: Record<string, unknown>,
    transaction?: Transaction,
  ) {
    return entidade.update(data, { transaction });
  }

  async substituirTipos(
    entidade_id: number,
    tipos: string[],
    transaction: Transaction,
  ) {
    await this.entidadeTipoModel.destroy({
      where: { entidade_id },
      transaction,
    });
    await this.entidadeTipoModel.bulkCreate(
      Array.from(new Set(tipos)).map((tipo) => ({ entidade_id, tipo })),
      { transaction },
    );
  }
}

