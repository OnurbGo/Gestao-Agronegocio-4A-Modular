import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import bcrypt from "bcrypt";
import { Conta } from "../accounts/conta.model";
import { Usuario } from "../users/usuario.model";
import { ContaModulo } from "../permissions/conta-modulo.model";
import { LoginInput } from "./auth.schema";
import { AuthContext, TokenPayload } from "./auth.types";
import { TokenService } from "./token.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Conta) private readonly contaModel: typeof Conta,
    private readonly tokenService: TokenService,
    private readonly auditService: AuditService,
  ) {}

  async login(data: LoginInput, ip?: string) {
    const conta = await this.contaModel.findOne({
      where: { email: data.email },
      include: [
        { model: Usuario, as: "usuario" },
        { model: ContaModulo, as: "modulos" },
      ],
    });

    if (!conta || !conta.ativo) {
      throw new BadRequestException("E-mail ou senha invalidos.");
    }

    const senhaValida = await bcrypt.compare(data.senha, conta.senha_hash);

    if (!senhaValida) {
      throw new BadRequestException("E-mail ou senha invalidos.");
    }

    await conta.update({ ultimo_login: new Date() });

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

    const conta = await this.contaModel.findOne({
      where: {
        id_conta: payload.id_conta,
        ativo: true,
      },
      include: [
        { model: Usuario, as: "usuario" },
        { model: ContaModulo, as: "modulos" },
      ],
    });

    if (!conta) {
      throw new UnauthorizedException("Conta nao autenticada.");
    }

    return this.toAuthContext(conta);
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
      possuiAdmin: modulos.some((item) => item.modulo === "ADMIN"),
      possuiGerente: modulos.some((item) => item.modulo === "GERENTE"),
    };
  }
}
