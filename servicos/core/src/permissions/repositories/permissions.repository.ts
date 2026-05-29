import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op, Transaction } from "sequelize";
import { Conta } from "../../accounts/entities/conta.entity";
import { SalvarPermissaoModuloDto } from "../dto/permissions.dto";
import { ContaModulo } from "../entities/conta-modulo.entity";

@Injectable()
export class PermissionsRepository {
  constructor(
    @InjectModel(ContaModulo)
    private readonly contaModuloModel: typeof ContaModulo,
    @InjectModel(Conta) private readonly contaModel: typeof Conta,
  ) {}

  buscarContaPorId(contaId: number) {
    return this.contaModel.findByPk(contaId);
  }

  listarPorConta(contaId: number) {
    return this.contaModuloModel.findAll({
      where: { conta_id: contaId },
      order: [["modulo", "ASC"]],
    });
  }

  criarTransacao() {
    return this.contaModuloModel.sequelize!.transaction();
  }

  async substituirPorConta(
    contaId: number,
    modulos: SalvarPermissaoModuloDto[],
    transaction: Transaction,
  ) {
    await this.contaModuloModel.destroy({
      where: { conta_id: contaId },
      transaction,
    });
    await this.contaModuloModel.bulkCreate(
      modulos.map((modulo) => ({ ...modulo, conta_id: contaId })),
      { transaction },
    );
  }

  contarAdminsAtivos(transaction?: Transaction) {
    return this.contaModuloModel.count({
      where: {
        modulo: "ADMIN",
        [Op.or]: [
          { pode_visualizar: true },
          { pode_criar: true },
          { pode_editar: true },
          { pode_excluir: true },
          { pode_restaurar: true },
        ],
      },
      include: [
        {
          model: Conta,
          as: "conta",
          attributes: [],
          where: { ativo: true },
          required: true,
        },
      ],
      transaction,
    });
  }
}

