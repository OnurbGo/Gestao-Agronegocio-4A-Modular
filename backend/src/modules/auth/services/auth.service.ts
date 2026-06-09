import { Injectable, UnauthorizedException } from "@nestjs/common";
import bcrypt from "bcrypt";
import { AccountsRepository } from "../../contas/repositories/accounts.repository";
import { AuditService } from "../../auditoria/services/audit.service";
import { Conta } from "../../contas/entities/conta.entity";
import { LoginInput } from "../dto/auth.dto";
import { AuthContext, TokenPayload } from "../types/auth.types";
import { TokenService } from "./token.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly accountsRepository: AccountsRepository,
    private readonly tokenService: TokenService,
    private readonly auditService: AuditService,
  ) {}

  async login(data: LoginInput, ip?: string) {
    const email = this.normalizarEmail(data.email);
    const conta =
      await this.accountsRepository.buscarContaParaAutenticacaoPorEmail(email);

    if (!conta || !conta.ativo) {
      throw new UnauthorizedException("E-mail ou senha inválidos.");
    }

    const senhaValida = await bcrypt.compare(data.senha, conta.senha_hash);

    if (!senhaValida) {
      throw new UnauthorizedException("E-mail ou senha inválidos.");
    }

    await this.accountsRepository.atualizarUltimoLogin(conta.id_conta);

    const token = this.tokenService.gerar({
      id_conta: conta.id_conta,
      id_usuario: conta.usuario_id,
      email: conta.email,
    });

    await this.auditService.registrar({
      conta_id: conta.id_conta,
      usuario_id: conta.usuario_id,
      acao: "LOGIN",
      recurso: "CONTA",
      recurso_id: conta.id_conta,
      ip,
    });

    return {
      token,
      usuario: this.toAuthContext(conta),
    };
  }

  async validarToken(token: string): Promise<AuthContext> {
    let payload: TokenPayload;

    try {
      payload = this.tokenService.verificar(token);
    } catch {
      throw new UnauthorizedException("Token invalido ou expirado.");
    }

    const conta = await this.accountsRepository.buscarContaAtivaPorId(
      payload.id_conta,
    );

    if (!conta) {
      throw new UnauthorizedException("Conta nao autenticada.");
    }

    this.validarTokenContraSenhaAlterada(payload, conta);

    return this.toAuthContext(conta);
  }

  private validarTokenContraSenhaAlterada(payload: TokenPayload, conta: Conta) {
    if (!conta.senha_alterada_em || !payload.iat) {
      return;
    }

    const tokenEmitidoEm = payload.iat * 1000;
    const senhaAlteradaEm = conta.senha_alterada_em.getTime();

    if (tokenEmitidoEm + 1000 < senhaAlteradaEm) {
      throw new UnauthorizedException("Token invalido apos troca de senha.");
    }
  }

  private normalizarEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private toAuthContext(conta: Conta): AuthContext {
    const modulos = (conta.modulos || []).map((modulo) =>
      modulo.get({ plain: true }),
    );

    return {
      conta_id: conta.id_conta,
      usuario_id: conta.usuario_id,
      nome: conta.usuario?.nome || "",
      imagem_perfil_url: conta.usuario?.imagem_perfil_url || null,
      observacao: conta.usuario?.observacao || null,
      email: conta.email,
      modulos,
      possuiAdmin: modulos.some(
        (item) => item.modulo === "ADMIN" && item.pode_visualizar,
      ),
      possuiGerente: modulos.some(
        (item) => item.modulo === "GERENTE" && item.pode_visualizar,
      ),
    };
  }
}

