import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { AuthContext } from "../auth/auth.types";
import { Usuario } from "./usuario.model";
import { AtualizarUsuarioInput } from "./users.schema";

@Injectable()
export class UsersService {
  constructor(@InjectModel(Usuario) private readonly usuarioModel: typeof Usuario) {}

  listar(ator: AuthContext) {
    if (!ator.possuiAdmin && !ator.possuiGerente) {
      throw new ForbiddenException("Apenas ADMIN ou GERENTE pode listar usuarios.");
    }

    return this.usuarioModel.findAll({ order: [["nome", "ASC"]] });
  }

  async buscarPorId(id_usuario: number, ator?: AuthContext) {
    if (
      ator &&
      ator.usuario_id !== id_usuario &&
      !ator.possuiAdmin &&
      !ator.possuiGerente
    ) {
      throw new ForbiddenException("Usuario sem permissao para acessar este perfil.");
    }

    const usuario = await this.usuarioModel.findByPk(id_usuario);

    if (!usuario) {
      throw new NotFoundException("Usuario nao encontrado.");
    }

    return usuario;
  }

  async atualizar(id_usuario: number, data: AtualizarUsuarioInput, ator: AuthContext) {
    const podeEditar = ator.usuario_id === id_usuario || ator.possuiAdmin || ator.possuiGerente;

    if (!podeEditar) {
      throw new ForbiddenException("Usuario sem permissao para alterar este perfil.");
    }

    const usuario = await this.buscarPorId(id_usuario, ator);
    await usuario.update(data);
    return usuario;
  }
}
