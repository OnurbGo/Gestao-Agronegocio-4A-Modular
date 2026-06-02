import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Transaction } from "sequelize";
import { AccountsEventsService } from "../../accounts/services/accounts-events.service";
import { AuthContext } from "../../auth/types/auth.types";
import { SalvarPermissoesInput } from "../dto/permissions.dto";
import { ContaModulo } from "../entities/conta-modulo.entity";
import { PermissionsRepository } from "../repositories/permissions.repository";

const MODULOS_PROTEGIDOS = ["ADMIN", "GERENTE"];

@Injectable()
export class PermissionsService {
  constructor(
    private readonly permissionsRepository: PermissionsRepository,
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

    return this.permissionsRepository.listarPorConta(contaId);
  }

  async salvar(contaId: number, data: SalvarPermissoesInput, ator: AuthContext) {
    if (!ator.possuiAdmin && !ator.possuiGerente) {
      throw new ForbiddenException("Apenas ADMIN ou GERENTE pode alterar permissoes.");
    }

    const conta = await this.permissionsRepository.buscarContaPorId(contaId);

    if (!conta) {
      throw new NotFoundException("Conta nao encontrada.");
    }

    const permissoesAtuais =
      await this.permissionsRepository.listarPorConta(contaId);

    this.validarPermissaoGerente(permissoesAtuais, data.modulos, ator);
    const modulos = data.modulos.filter((modulo) =>
      this.moduloTemPermissaoAtiva(modulo),
    );

    const transaction = await this.permissionsRepository.criarTransacao();

    try {
      if (
        conta.ativo &&
        this.possuiModuloAtivo(permissoesAtuais, "ADMIN") &&
        !this.possuiModuloAtivo(modulos, "ADMIN")
      ) {
        await this.garantirAdminAtivoRestante(transaction);
      }

      await this.permissionsRepository.substituirPorConta(
        contaId,
        modulos,
        transaction,
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

    const alvoPossuiModuloProtegido = this.possuiModuloProtegido(permissoesAtuais);

    if (alvoPossuiModuloProtegido) {
      throw new ForbiddenException(
        "GERENTE nao pode alterar permissoes de conta ADMIN ou GERENTE.",
      );
    }

    const concedendoModuloProtegido =
      this.possuiModuloProtegido(proximasPermissoes);

    if (concedendoModuloProtegido) {
      throw new ForbiddenException(
        "GERENTE nao pode conceder permissao ADMIN ou GERENTE.",
      );
    }
  }

  private possuiModuloProtegido(
    modulos: Array<SalvarPermissoesInput["modulos"][number] | ContaModulo>,
  ) {
    return MODULOS_PROTEGIDOS.some((modulo) =>
      this.possuiModuloAtivo(modulos, modulo),
    );
  }

  private possuiModuloAtivo(
    modulos: Array<SalvarPermissoesInput["modulos"][number] | ContaModulo>,
    modulo: string,
  ) {
    return modulos.some(
      (permissao) =>
        permissao.modulo === modulo && this.moduloTemPermissaoAtiva(permissao),
    );
  }

  private async garantirAdminAtivoRestante(transaction: Transaction) {
    const totalAdminsAtivos =
      await this.permissionsRepository.contarAdminsAtivos(transaction);

    if (totalAdminsAtivos <= 1) {
      throw new BadRequestException(
        "Nao e permitido deixar o sistema sem ADMIN ativo.",
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

