import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { unlink } from "fs/promises";
import path from "path";
import { Op } from "sequelize";
import { AuthContext } from "../../auth/types/auth.types";
import { getPagination, toPaginatedResponse } from "../../shared/utils/pagination";
import { userPhotoUploadDir } from "../utils/user-photo.upload";
import { AtualizarUsuarioInput, ListarUsuariosQuery } from "../dto/users.dto";
import { UsersRepository } from "../repositories/users.repository";

type UploadedUserPhoto = {
  filename?: string;
  originalname: string;
  mimetype: string;
  size: number;
};

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async listar(query: ListarUsuariosQuery, ator: AuthContext) {
    if (!ator.possuiAdmin && !ator.possuiGerente) {
      throw new ForbiddenException("Apenas ADMIN ou GERENTE pode listar usuarios.");
    }

    const { page, limit, offset } = getPagination(query);
    const where: Record<string, unknown> = {};

    if (query.search) {
      where[Op.or as unknown as string] = [
        { nome: { [Op.like]: `%${query.search}%` } },
        { observacao: { [Op.like]: `%${query.search}%` } },
      ];
    }

    const { rows, count } = await this.usersRepository.listarPaginado({
      where,
      limit,
      offset,
      order: [["nome", "ASC"]],
    });

    return toPaginatedResponse(rows, count, page, limit);
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

    const usuario = await this.usersRepository.buscarPorId(id_usuario);

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

  async atualizarFoto(
    id_usuario: number,
    file: UploadedUserPhoto | undefined,
    ator: AuthContext,
  ) {
    const podeEditar =
      ator.usuario_id === id_usuario || ator.possuiAdmin || ator.possuiGerente;

    if (!podeEditar) {
      throw new ForbiddenException("Usuario sem permissao para alterar este perfil.");
    }

    if (!file?.filename) {
      throw new BadRequestException("Foto de perfil e obrigatoria.");
    }

    const usuario = await this.buscarPorId(id_usuario, ator);
    const fotoAnterior = usuario.imagem_perfil_url;
    const imagem_perfil_url = `/api/core/uploads/usuarios/${file.filename}`;

    await usuario.update({ imagem_perfil_url });
    await this.removerFotoAnterior(fotoAnterior, file.filename);

    return usuario;
  }

  private async removerFotoAnterior(
    imagem_perfil_url: string | null,
    novaFoto: string,
  ) {
    if (!imagem_perfil_url?.includes("/uploads/usuarios/")) {
      return;
    }

    const filename = imagem_perfil_url.split("/").pop();

    if (!filename || filename === novaFoto) {
      return;
    }

    try {
      await unlink(path.join(userPhotoUploadDir, filename));
    } catch {
      // A troca de foto nao deve falhar se o arquivo antigo ja nao existir.
    }
  }
}

