import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { FindAndCountOptions, Transaction } from "sequelize";
import { Entidade } from "../../entidades/entities/entidade.entity";
import { ImovelProprietario } from "../entities/imovel-proprietario.entity";
import { Imovel } from "../entities/imovel.entity";

@Injectable()
export class ImoveisRepository {
  constructor(
    @InjectModel(Imovel) private readonly imovelModel: typeof Imovel,
    @InjectModel(Entidade) private readonly entidadeModel: typeof Entidade,
    @InjectModel(ImovelProprietario)
    private readonly proprietarioModel: typeof ImovelProprietario,
  ) {}

  listarPaginado(options: FindAndCountOptions) {
    return this.imovelModel.findAndCountAll(options);
  }

  criarTransacao() {
    return this.imovelModel.sequelize!.transaction();
  }

  buscarPorId(id_imovel: number, transaction?: Transaction) {
    return this.imovelModel.findByPk(id_imovel, {
      include: [{ model: Entidade, as: "proprietarios" }],
      transaction,
    });
  }

  buscarEntidadesPorIds(ids: number[], transaction?: Transaction) {
    if (!ids.length) {
      return [];
    }

    return this.entidadeModel.findAll({
      where: { id_entidade: ids },
      transaction,
    });
  }

  criar(data: Record<string, unknown>, transaction?: Transaction) {
    return this.imovelModel.create(data, { transaction });
  }

  async sincronizarProprietarios(
    imovel_id: number,
    ids: number[],
    transaction?: Transaction,
  ) {
    await this.proprietarioModel.destroy({ where: { imovel_id }, transaction });

    if (ids.length > 0) {
      await this.proprietarioModel.bulkCreate(
        ids.map((entidade_id) => ({ imovel_id, entidade_id })),
        { transaction },
      );
    }
  }
}
