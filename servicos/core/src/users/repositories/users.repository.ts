import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { FindAndCountOptions } from "sequelize";
import { Usuario } from "../entities/usuario.entity";

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(Usuario)
    private readonly usuarioModel: typeof Usuario,
  ) {}

  listarPaginado(options: FindAndCountOptions) {
    return this.usuarioModel.findAndCountAll(options);
  }

  buscarPorId(id_usuario: number) {
    return this.usuarioModel.findByPk(id_usuario);
  }
}

