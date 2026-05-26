import bcrypt from "bcrypt";
import ApiError from "../../shared/errors/api-error";
import AuditoriaService from "../auditoria/auditoria.service";
import { LoginInput } from "./auth.schema";
import TokenService from "./token.service";
import UsuarioModulo from "../usuarios/usuario-modulo.model";
import Usuario from "../usuarios/usuario.model";
import { Modulo, PermissaoModulo } from "../permissoes/modulo.enum";

class AuthService {
  async login(data: LoginInput, ip?: string) {
    const usuario = await Usuario.findOne({
      where: {
        email: data.email,
        ativo: true,
      },
    });

    if (!usuario) {
      throw new ApiError("E-mail ou senha inválidos.", 400);
    }

    const senhaValida = await bcrypt.compare(
      data.senha,
      usuario.get("senha_hash") as string,
    );

    if (!senhaValida) {
      throw new ApiError("E-mail ou senha inválidos.", 400);
    }

    await usuario.update({ ultimo_login: new Date() });

    const modulos = await this.buscarModulos(usuario.get("id_usuario") as number);
    const token = TokenService.gerar({
      id_usuario: usuario.get("id_usuario") as number,
      email: usuario.get("email") as string,
      modulos: modulos.map((permissao) => permissao.modulo) as Modulo[],
    });

    await AuditoriaService.registrar({
      usuario_id: usuario.get("id_usuario") as number,
      acao: "LOGIN",
      recurso: "USUARIO",
      recurso_id: usuario.get("id_usuario") as number,
      ip,
    });

    return {
      token,
      usuario: {
        ...this.sanitizar(usuario),
        modulos,
      },
    };
  }

  async me(id_usuario: number) {
    const usuario = await Usuario.findOne({
      where: {
        id_usuario,
        ativo: true,
      },
    });

    if (!usuario) {
      throw new ApiError("Usuário não encontrado.", 404);
    }

    return {
      ...this.sanitizar(usuario),
      modulos: await this.buscarModulos(id_usuario),
    };
  }

  private async buscarModulos(usuario_id: number) {
    const permissoes = await UsuarioModulo.findAll({
      where: { usuario_id },
      order: [["modulo", "ASC"]],
    });

    return permissoes.map(
      (permissao) => permissao.get({ plain: true }) as PermissaoModulo,
    );
  }

  private sanitizar(usuario: Usuario) {
    const plain = usuario.get({ plain: true }) as Record<string, unknown>;
    delete plain.senha_hash;
    return plain;
  }
}

export default new AuthService();
