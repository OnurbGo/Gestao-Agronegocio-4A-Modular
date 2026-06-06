import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import bcrypt from "bcrypt";
import { Op, Transaction } from "sequelize";
import { AuditService } from "../../audit/services/audit.service";
import { AuthContext } from "../../auth/types/auth.types";
import { ContaModulo } from "../../permissions/entities/conta-modulo.entity";
import { PermissaoModulo } from "../../permissions/types/modulo.enum";
import {
  getPagination,
  toPaginatedResponse,
} from "../../shared/utils/pagination";
import { Usuario } from "../../users/entities/usuario.entity";
import { Conta } from "../entities/conta.entity";
import { AccountsRepository } from "../repositories/accounts.repository";
import { AccountsEventsService } from "./accounts-events.service";
import { SolicitacaoConta } from "../entities/solicitacao-conta.entity";
import {
  AlterarSenhaContaInput,
  AprovarSolicitacaoInput,
  AtualizarStatusContaInput,
  CriarContaInput,
  ListarContasQuery,
  ListarSolicitacoesQuery,
  RecusarSolicitacaoInput,
  SolicitarContaInput,
} from "../dto/accounts.dto";

const MODULOS_PROTEGIDOS = ["ADMIN", "GERENTE"];

@Injectable()
export class AccountsService {
  constructor(
    private readonly accountsRepository: AccountsRepository,
    private readonly eventsService: AccountsEventsService,
    private readonly auditService: AuditService,
  ) {}

  async listar(query: ListarContasQuery, ator: AuthContext) {
    if (!this.podeAdministrarAcessos(ator)) {
      throw new ForbiddenException(
        "Apenas ADMIN ou GERENTE pode listar contas.",
      );
    }

    const { page, limit, offset } = getPagination(query);
    const where: Record<string, unknown> = {};

    if (query.search) {
      where[Op.or as unknown as string] = [
        { email: { [Op.like]: `%${query.search}%` } },
        { "$usuario.nome$": { [Op.like]: `%${query.search}%` } },
      ];
    }

    const { rows, count } = await this.accountsRepository.listarContas({
      where,
      attributes: { exclude: ["senha_hash"] },
      include: [
        { model: Usuario, as: "usuario" },
        { model: ContaModulo, as: "modulos" },
      ],
      distinct: true,
      limit,
      offset,
      order: [["id_conta", "ASC"]],
      subQuery: false,
    });

    return toPaginatedResponse(rows, count, page, limit);
  }

  async criar(data: CriarContaInput, ator?: AuthContext, ip?: string) {
    const email = this.normalizarEmail(data.email);
    const senha_hash = await bcrypt.hash(data.senha, 10);
    const transaction = await this.accountsRepository.criarTransacao({
      isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    });
    let contaId = 0;
    let usuarioId = 0;

    try {
      const totalContas = await this.accountsRepository.contarContas(transaction);
      const primeiraConta = totalContas === 0;

      if (!primeiraConta && !this.podeAdministrarAcessos(ator)) {
        throw new ForbiddenException(
          "Apenas ADMIN ou GERENTE pode criar contas.",
        );
      }

      const modulos = primeiraConta
        ? this.getAdminPadrao()
        : this.prepararModulos(data.modulos || [], ator);

      const usuario = await this.accountsRepository.criarUsuario(
        {
          nome: data.nome,
          imagem_perfil_url: data.imagem_perfil_url || null,
          observacao: data.observacao || null,
        },
        transaction,
      );

      const conta = await this.accountsRepository.criarConta(
        {
          usuario_id: usuario.id_usuario,
          email,
          senha_hash,
          ativo: true,
          senha_alterada_em: new Date(),
        },
        transaction,
      );

      await this.accountsRepository.criarModulos(
        modulos.map((modulo) => ({
          ...modulo,
          conta_id: conta.id_conta,
        })),
        transaction,
      );

      await transaction.commit();
      contaId = conta.id_conta;
      usuarioId = usuario.id_usuario;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    const criada = await this.buscarPorId(contaId);
    await this.auditService.registrar({
      conta_id: ator?.conta_id || contaId,
      usuario_id: ator?.usuario_id || usuarioId,
      acao: "CONTA_CRIADA",
      recurso: "CONTA",
      recurso_id: contaId,
      valor_novo: criada?.get({ plain: true }),
      ip,
    });

    return criada;
  }

  async buscarPorId(id_conta: number, ator?: AuthContext) {
    if (
      ator &&
      ator.conta_id !== id_conta &&
      !this.podeAdministrarAcessos(ator)
    ) {
      throw new ForbiddenException(
        "Usuario sem permissao para acessar esta conta.",
      );
    }

    const conta = await this.accountsRepository.buscarContaPorId(id_conta);

    if (!conta) {
      throw new NotFoundException("Conta nao encontrada.");
    }

    return conta;
  }

  async atualizarStatus(
    id_conta: number,
    data: AtualizarStatusContaInput,
    ator: AuthContext,
    ip?: string,
  ) {
    if (!this.podeAdministrarAcessos(ator)) {
      throw new ForbiddenException(
        "Apenas ADMIN ou GERENTE pode alterar status.",
      );
    }

    const conta = await this.buscarPorId(id_conta);
    this.garantirGerenteNaoAlteraProtegidos(ator, conta.modulos || []);

    const anterior = conta.get({ plain: true });
    const transaction = await this.accountsRepository.criarTransacao();

    try {
      if (!data.ativo && this.possuiModuloAtivo(conta.modulos || [], "ADMIN")) {
        await this.garantirAdminAtivoRestante(transaction);
      }

      await this.accountsRepository.atualizarConta(
        id_conta,
        { ativo: data.ativo },
        transaction,
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    if (!data.ativo) {
      this.eventsService.emitAccountDeactivated(id_conta);
    }

    await this.auditService.registrar({
      conta_id: ator.conta_id,
      usuario_id: ator.usuario_id,
      acao: "CONTA_STATUS_ATUALIZADO",
      recurso: "CONTA",
      recurso_id: id_conta,
      valor_anterior: anterior,
      valor_novo: (await this.buscarPorId(id_conta)).get({ plain: true }),
      ip,
    });

    return this.buscarPorId(id_conta);
  }

  async alterarSenha(
    id_conta: number,
    data: AlterarSenhaContaInput,
    ator: AuthContext,
    ip?: string,
  ) {
    if (!this.podeAdministrarAcessos(ator)) {
      throw new ForbiddenException(
        "Apenas ADMIN ou GERENTE pode redefinir senhas.",
      );
    }

    const conta = await this.buscarPorId(id_conta);
    this.garantirGerenteNaoAlteraProtegidos(ator, conta.modulos || []);

    const anterior = conta.get({ plain: true });
    const senha_hash = await bcrypt.hash(data.senha, 10);

    await this.accountsRepository.atualizarConta(id_conta, {
      senha_hash,
      senha_alterada_em: new Date(),
    });

    this.eventsService.emitAccountCredentialsUpdated(id_conta);

    const atualizada = await this.buscarPorId(id_conta);
    await this.auditService.registrar({
      conta_id: ator.conta_id,
      usuario_id: ator.usuario_id,
      acao: "CONTA_SENHA_REDEFINIDA",
      recurso: "CONTA",
      recurso_id: id_conta,
      valor_anterior: anterior,
      valor_novo: atualizada.get({ plain: true }),
      ip,
    });

    return atualizada;
  }

  async solicitar(data: SolicitarContaInput, ip?: string) {
    const email = this.normalizarEmail(data.email);
    const contaExistente = await this.accountsRepository.buscarContaPorEmail(
      email,
      true,
    );

    if (contaExistente) {
      throw new BadRequestException("Ja existe uma conta com este e-mail.");
    }

    const solicitacaoAberta =
      await this.accountsRepository.buscarSolicitacaoPendentePorEmail(email);

    if (solicitacaoAberta) {
      throw new BadRequestException(
        "Ja existe uma solicitacao pendente para este e-mail.",
      );
    }

    const senha_hash = await bcrypt.hash(data.senha, 10);
    const solicitacao = await this.accountsRepository.criarSolicitacao({
      nome: data.nome,
      email,
      imagem_perfil_url: data.imagem_perfil_url || null,
      observacao: data.observacao || null,
      senha_hash,
      modulos_solicitados: data.modulos_solicitados || null,
      status: "PENDENTE",
    });

    await this.auditService.registrar({
      acao: "SOLICITACAO_CONTA_CRIADA",
      recurso: "SOLICITACAO_CONTA",
      recurso_id: solicitacao.id_solicitacao_conta,
      valor_novo: this.sanitizarSolicitacao(solicitacao),
      ip,
    });

    return this.sanitizarSolicitacao(solicitacao);
  }

  async listarSolicitacoes(query: ListarSolicitacoesQuery, ator: AuthContext) {
    if (!this.podeAdministrarAcessos(ator)) {
      throw new ForbiddenException(
        "Apenas ADMIN ou GERENTE pode listar solicitacoes.",
      );
    }

    const { page, limit, offset } = getPagination(query);
    const where: Record<string, unknown> = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where[Op.or as unknown as string] = [
        { nome: { [Op.like]: `%${query.search}%` } },
        { email: { [Op.like]: `%${query.search}%` } },
      ];
    }

    const { rows, count } = await this.accountsRepository.listarSolicitacoes({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      attributes: { exclude: ["senha_hash"] },
    });

    return toPaginatedResponse(rows, count, page, limit);
  }

  async aprovarSolicitacao(
    idSolicitacao: number,
    data: AprovarSolicitacaoInput,
    ator: AuthContext,
    ip?: string,
  ) {
    if (!this.podeAdministrarAcessos(ator)) {
      throw new ForbiddenException(
        "Apenas ADMIN ou GERENTE pode aprovar solicitacoes.",
      );
    }

    const solicitacao = await this.buscarSolicitacaoPendente(idSolicitacao);
    const modulos = this.prepararModulos(data.modulos, ator);
    const email = this.normalizarEmail(solicitacao.email);
    const contaExistente = await this.accountsRepository.buscarContaPorEmail(
      email,
      true,
    );

    if (contaExistente) {
      throw new BadRequestException("Ja existe uma conta com este e-mail.");
    }

    const transaction = await this.accountsRepository.criarTransacao();
    let contaId = 0;

    try {
      const usuario = await this.accountsRepository.criarUsuario(
        {
          nome: solicitacao.nome,
          imagem_perfil_url: solicitacao.imagem_perfil_url,
          observacao: solicitacao.observacao,
        },
        transaction,
      );

      const conta = await this.accountsRepository.criarConta(
        {
          usuario_id: usuario.id_usuario,
          email,
          senha_hash: solicitacao.senha_hash,
          ativo: true,
          senha_alterada_em: new Date(),
        },
        transaction,
      );

      await this.accountsRepository.criarModulos(
        modulos.map((modulo) => ({
          ...modulo,
          conta_id: conta.id_conta,
        })),
        transaction,
      );

      await solicitacao.update(
        {
          status: "APROVADA",
          aprovado_por_usuario_id: ator.usuario_id,
          aprovado_em: new Date(),
        },
        { transaction },
      );

      await transaction.commit();
      contaId = conta.id_conta;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    const criada = await this.buscarPorId(contaId);
    await this.auditService.registrar({
      conta_id: ator.conta_id,
      usuario_id: ator.usuario_id,
      acao: "SOLICITACAO_CONTA_APROVADA",
      recurso: "SOLICITACAO_CONTA",
      recurso_id: idSolicitacao,
      valor_novo: criada?.get({ plain: true }),
      ip,
    });

    return criada;
  }

  async recusarSolicitacao(
    idSolicitacao: number,
    data: RecusarSolicitacaoInput,
    ator: AuthContext,
    ip?: string,
  ) {
    if (!this.podeAdministrarAcessos(ator)) {
      throw new ForbiddenException(
        "Apenas ADMIN ou GERENTE pode recusar solicitacoes.",
      );
    }

    const solicitacao = await this.buscarSolicitacaoPendente(idSolicitacao);
    const anterior = this.sanitizarSolicitacao(solicitacao);

    await solicitacao.update({
      status: "RECUSADA",
      recusado_por_usuario_id: ator.usuario_id,
      recusado_em: new Date(),
      motivo_recusa: data.motivo_recusa,
    });

    await this.auditService.registrar({
      conta_id: ator.conta_id,
      usuario_id: ator.usuario_id,
      acao: "SOLICITACAO_CONTA_RECUSADA",
      recurso: "SOLICITACAO_CONTA",
      recurso_id: idSolicitacao,
      valor_anterior: anterior,
      valor_novo: this.sanitizarSolicitacao(solicitacao),
      ip,
    });

    return this.sanitizarSolicitacao(solicitacao);
  }

  private getAdminPadrao(): PermissaoModulo[] {
    return [
      {
        modulo: "ADMIN",
        pode_visualizar: true,
        pode_criar: true,
        pode_editar: true,
        pode_excluir: true,
        pode_restaurar: true,
      },
    ];
  }

  private podeAdministrarAcessos(ator?: AuthContext) {
    return Boolean(ator?.possuiAdmin || ator?.possuiGerente);
  }

  private prepararModulos(
    modulos: PermissaoModulo[],
    ator?: AuthContext,
  ): PermissaoModulo[] {
    this.validarGerenteNaoConcedeProtegidos(modulos, ator);
    return modulos.filter((modulo) => this.moduloTemPermissaoAtiva(modulo));
  }

  private garantirGerenteNaoAlteraProtegidos(
    ator: AuthContext,
    modulosAlvo: PermissaoModulo[],
  ) {
    if (ator.possuiAdmin || !ator.possuiGerente) {
      return;
    }

    if (this.possuiModuloProtegido(modulosAlvo)) {
      throw new ForbiddenException(
        "GERENTE nao pode alterar contas com permissao ADMIN ou GERENTE.",
      );
    }
  }

  private validarGerenteNaoConcedeProtegidos(
    modulos: PermissaoModulo[],
    ator?: AuthContext,
  ) {
    if (ator?.possuiAdmin || !ator?.possuiGerente) {
      return;
    }

    if (this.possuiModuloProtegido(modulos)) {
      throw new ForbiddenException(
        "GERENTE nao pode conceder permissao ADMIN ou GERENTE.",
      );
    }
  }

  private possuiModuloProtegido(modulos: PermissaoModulo[]) {
    return MODULOS_PROTEGIDOS.some((modulo) =>
      this.possuiModuloAtivo(modulos, modulo),
    );
  }

  private possuiModuloAtivo(modulos: PermissaoModulo[], modulo: string) {
    return modulos.some(
      (permissao) =>
        permissao.modulo === modulo && this.moduloTemPermissaoAtiva(permissao),
    );
  }

  private moduloTemPermissaoAtiva(modulo: PermissaoModulo) {
    return Boolean(
      modulo.pode_visualizar ||
        modulo.pode_criar ||
        modulo.pode_editar ||
        modulo.pode_excluir ||
        modulo.pode_restaurar,
    );
  }

  private async garantirAdminAtivoRestante(transaction: Transaction) {
    const totalAdminsAtivos = await this.contarAdminsAtivos(transaction);

    if (totalAdminsAtivos <= 1) {
      throw new BadRequestException(
        "Nao e permitido deixar o sistema sem ADMIN ativo.",
      );
    }
  }

  private contarAdminsAtivos(transaction?: Transaction) {
    return this.accountsRepository.contarAdminsAtivos(transaction);
  }

  private normalizarEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private async buscarSolicitacaoPendente(idSolicitacao: number) {
    const solicitacao =
      await this.accountsRepository.buscarSolicitacaoPorId(idSolicitacao);

    if (!solicitacao) {
      throw new NotFoundException("Solicitacao nao encontrada.");
    }

    if (solicitacao.status !== "PENDENTE") {
      throw new BadRequestException("Solicitacao ja foi analisada.");
    }

    return solicitacao;
  }

  private sanitizarSolicitacao(solicitacao: SolicitacaoConta) {
    const plain = solicitacao.get({ plain: true });
    delete plain.senha_hash;
    return plain;
  }
}

