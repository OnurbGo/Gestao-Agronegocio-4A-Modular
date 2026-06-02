import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import bcrypt from "bcrypt";
import { Op } from "sequelize";
import { AuditService } from "../audit/audit.service";
import { AuthContext } from "../auth/auth.types";
import { ContaModulo } from "../permissions/conta-modulo.model";
import { PermissaoModulo } from "../permissions/modulo.enum";
import { Usuario } from "../users/usuario.model";
import { Conta } from "./conta.model";
import { AccountsEventsService } from "./accounts.events";
import { SolicitacaoConta } from "./solicitacao-conta.model";
import {
  AprovarSolicitacaoInput,
  AtualizarStatusContaInput,
  CriarContaInput,
  RecusarSolicitacaoInput,
  SolicitarContaInput,
} from "./accounts.schema";

@Injectable()
export class AccountsService {
  constructor(
    @InjectModel(Conta) private readonly contaModel: typeof Conta,
    @InjectModel(Usuario) private readonly usuarioModel: typeof Usuario,
    @InjectModel(ContaModulo)
    private readonly contaModuloModel: typeof ContaModulo,
    @InjectModel(SolicitacaoConta)
    private readonly solicitacaoModel: typeof SolicitacaoConta,
    private readonly eventsService: AccountsEventsService,
    private readonly auditService: AuditService,
  ) {}

  async listar(ator: AuthContext) {
    if (!this.podeAdministrarAcessos(ator)) {
      throw new ForbiddenException(
        "Apenas ADMIN ou GERENTE pode listar contas.",
      );
    }

    return this.contaModel.findAll({
      attributes: { exclude: ["senha_hash"] },
      include: [
        { model: Usuario, as: "usuario" },
        { model: ContaModulo, as: "modulos" },
      ],
      order: [["id_conta", "ASC"]],
    });
  }

  async criar(data: CriarContaInput, ator?: AuthContext, ip?: string) {
    const totalContas = await this.contaModel.count({ paranoid: false });
    const primeiraConta = totalContas === 0;

    if (!primeiraConta && !this.podeAdministrarAcessos(ator)) {
      throw new ForbiddenException(
        "Apenas ADMIN ou GERENTE pode criar contas.",
      );
    }

    const senha_hash = await bcrypt.hash(data.senha, 10);
    const transaction = await this.contaModel.sequelize!.transaction();

    try {
      const usuario = await this.usuarioModel.create(
        {
          nome: data.nome,
          imagem_perfil_url: data.imagem_perfil_url || null,
          observacao: data.observacao || null,
        },
        { transaction },
      );

      const conta = await this.contaModel.create(
        {
          usuario_id: usuario.id_usuario,
          email: data.email,
          senha_hash,
          ativo: true,
          senha_alterada_em: new Date(),
        },
        { transaction },
      );

      const modulos = primeiraConta
        ? this.getAdminPadrao()
        : this.prepararModulos(data.modulos || [], ator);

      await this.contaModuloModel.bulkCreate(
        modulos.map((modulo) => ({
          ...modulo,
          conta_id: conta.id_conta,
        })),
        { transaction },
      );

      await transaction.commit();

      const criada = await this.buscarPorId(conta.id_conta);
      await this.auditService.registrar({
        conta_id: ator?.conta_id || conta.id_conta,
        usuario_id: ator?.usuario_id || usuario.id_usuario,
        acao: "CONTA_CRIADA",
        recurso: "CONTA",
        recurso_id: conta.id_conta,
        valor_novo: criada?.get({ plain: true }),
        ip,
      });

      return criada;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
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

    const conta = await this.contaModel.findByPk(id_conta, {
      attributes: { exclude: ["senha_hash"] },
      include: [
        { model: Usuario, as: "usuario" },
        { model: ContaModulo, as: "modulos" },
      ],
    });

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
    this.garantirGerenteNaoAlteraAdmin(ator, conta.modulos || []);

    const anterior = conta.get({ plain: true });

    await conta.update({ ativo: data.ativo });

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
      valor_novo: conta.get({ plain: true }),
      ip,
    });

    return this.buscarPorId(id_conta);
  }

  async solicitar(data: SolicitarContaInput, ip?: string) {
    const contaExistente = await this.contaModel.findOne({
      where: { email: data.email },
      paranoid: false,
    });

    if (contaExistente) {
      throw new BadRequestException("Ja existe uma conta com este e-mail.");
    }

    const solicitacaoAberta = await this.solicitacaoModel.findOne({
      where: {
        email: data.email,
        status: { [Op.in]: ["PENDENTE"] },
      },
    });

    if (solicitacaoAberta) {
      throw new BadRequestException(
        "Ja existe uma solicitacao pendente para este e-mail.",
      );
    }

    const senha_hash = await bcrypt.hash(data.senha, 10);
    const solicitacao = await this.solicitacaoModel.create({
      nome: data.nome,
      email: data.email,
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

  listarSolicitacoes(ator: AuthContext) {
    if (!this.podeAdministrarAcessos(ator)) {
      throw new ForbiddenException(
        "Apenas ADMIN ou GERENTE pode listar solicitacoes.",
      );
    }

    return this.solicitacaoModel.findAll({
      order: [["createdAt", "DESC"]],
      attributes: { exclude: ["senha_hash"] },
    });
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
    const contaExistente = await this.contaModel.findOne({
      where: { email: solicitacao.email },
      paranoid: false,
    });

    if (contaExistente) {
      throw new BadRequestException("Ja existe uma conta com este e-mail.");
    }

    const transaction = await this.contaModel.sequelize!.transaction();

    try {
      const usuario = await this.usuarioModel.create(
        {
          nome: solicitacao.nome,
          imagem_perfil_url: solicitacao.imagem_perfil_url,
          observacao: solicitacao.observacao,
        },
        { transaction },
      );

      const conta = await this.contaModel.create(
        {
          usuario_id: usuario.id_usuario,
          email: solicitacao.email,
          senha_hash: solicitacao.senha_hash,
          ativo: true,
          senha_alterada_em: new Date(),
        },
        { transaction },
      );

      await this.contaModuloModel.bulkCreate(
        modulos.map((modulo) => ({
          ...modulo,
          conta_id: conta.id_conta,
        })),
        { transaction },
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

      const criada = await this.buscarPorId(conta.id_conta);
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
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
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
    this.validarGerenteNaoConcedeAdmin(modulos, ator);
    return modulos.filter((modulo) => this.moduloTemPermissaoAtiva(modulo));
  }

  private garantirGerenteNaoAlteraAdmin(
    ator: AuthContext,
    modulosAlvo: PermissaoModulo[],
  ) {
    if (ator.possuiAdmin || !ator.possuiGerente) {
      return;
    }

    if (this.possuiModuloAtivo(modulosAlvo, "ADMIN")) {
      throw new ForbiddenException(
        "GERENTE nao pode alterar contas com permissao ADMIN.",
      );
    }
  }

  private validarGerenteNaoConcedeAdmin(
    modulos: PermissaoModulo[],
    ator?: AuthContext,
  ) {
    if (ator?.possuiAdmin || !ator?.possuiGerente) {
      return;
    }

    if (this.possuiModuloAtivo(modulos, "ADMIN")) {
      throw new ForbiddenException(
        "GERENTE nao pode conceder permissao ADMIN.",
      );
    }
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

  private async buscarSolicitacaoPendente(idSolicitacao: number) {
    const solicitacao = await this.solicitacaoModel.findByPk(idSolicitacao);

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
