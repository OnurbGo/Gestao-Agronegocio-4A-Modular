import { ForbiddenException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { AccountsEventsService } from "../accounts/accounts.events";
import { AuthContext } from "../auth/auth.types";
import { ContaModulo } from "./conta-modulo.model";
import { SalvarPermissoesInput } from "./permissions.schema";

@Injectable()
export class PermissionsService {
  constructor(
    @InjectModel(ContaModulo)
    private readonly contaModuloModel: typeof ContaModulo,
    private readonly eventsService: AccountsEventsService,
  ) {}

  listar(contaId: number, ator?: AuthContext) {
    if (
      ator &&
      ator.conta_id !== contaId &&
      !ator.possuiAdmin &&
      !ator.possuiGerente
    ) {
      throw new ForbiddenException("Usuario sem permissao para consultar permissoes.");
    }

    return this.contaModuloModel.findAll({
      where: { conta_id: contaId },
      order: [["modulo", "ASC"]],
    });
  }

  async salvar(contaId: number, data: SalvarPermissoesInput, ator: AuthContext) {
    if (!ator.possuiAdmin && !ator.possuiGerente) {
      throw new ForbiddenException("Apenas ADMIN ou GERENTE pode alterar permissoes.");
    }

    const transaction = await this.contaModuloModel.sequelize!.transaction();

    try {
      await this.contaModuloModel.destroy({
        where: { conta_id: contaId },
        transaction,
      });
      await this.contaModuloModel.bulkCreate(
        data.modulos.map((modulo) => ({ ...modulo, conta_id: contaId })),
        { transaction },
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    this.eventsService.emitPermissionsUpdated(contaId);
    return this.listar(contaId);
  }
}
