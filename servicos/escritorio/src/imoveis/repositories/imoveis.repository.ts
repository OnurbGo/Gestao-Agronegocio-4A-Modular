import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { FindAndCountOptions } from "sequelize";
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

  buscarPorId(id_imovel: number) {
    return this.imovelModel.findByPk(id_imovel, {
      include: [{ model: Entidade, as: "proprietarios" }],
    });
  }

  buscarEntidadePorId(id_entidade: number) {
    return this.entidadeModel.findByPk(id_entidade);
  }

  criar(data: Record<string, unknown>) {
    return this.imovelModel.create(data);
  }

  async sincronizarProprietarios(imovel_id: number, ids: number[]) {
    await this.proprietarioModel.destroy({ where: { imovel_id } });

    if (ids.length > 0) {
      await this.proprietarioModel.bulkCreate(
        ids.map((entidade_id) => ({ imovel_id, entidade_id })),
      );
    }
  }
}
