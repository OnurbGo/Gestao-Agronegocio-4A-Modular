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

    const permissoesAtuais = await this.contaModuloModel.findAll({
      where: { conta_id: contaId },
    });

    this.validarPermissaoGerente(permissoesAtuais, data.modulos, ator);
    const modulos = data.modulos.filter((modulo) =>
      this.moduloTemPermissaoAtiva(modulo),
    );

    const transaction = await this.contaModuloModel.sequelize!.transaction();

    try {
      await this.contaModuloModel.destroy({
        where: { conta_id: contaId },
        transaction,
      });
      await this.contaModuloModel.bulkCreate(
        modulos.map((modulo) => ({ ...modulo, conta_id: contaId })),
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

  private validarPermissaoGerente(
    permissoesAtuais: ContaModulo[],
    proximasPermissoes: SalvarPermissoesInput["modulos"],
    ator: AuthContext,
  ) {
    if (ator.possuiAdmin || !ator.possuiGerente) {
      return;
    }

    const alvoPossuiAdmin = permissoesAtuais.some(
      (permissao) =>
        permissao.modulo === "ADMIN" &&
        this.moduloTemPermissaoAtiva(permissao),
    );

    if (alvoPossuiAdmin) {
      throw new ForbiddenException(
        "GERENTE nao pode alterar permissoes de conta ADMIN.",
      );
    }

    const concedendoAdmin = proximasPermissoes.some(
      (permissao) =>
        permissao.modulo === "ADMIN" &&
        this.moduloTemPermissaoAtiva(permissao),
    );

    if (concedendoAdmin) {
      throw new ForbiddenException(
        "GERENTE nao pode conceder permissao ADMIN.",
      );
    }
  }

  private moduloTemPermissaoAtiva(
    modulo: SalvarPermissoesInput["modulos"][number] | ContaModulo,
  ) {
    return Boolean(
      modulo.pode_visualizar ||
        modulo.pode_criar ||
        modulo.pode_editar ||
        modulo.pode_excluir ||
        modulo.pode_restaurar,
    );
  }
}
