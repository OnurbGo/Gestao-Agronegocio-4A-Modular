import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { FindAndCountOptions } from "sequelize";
import { Conta } from "../../accounts/entities/conta.entity";
import { ContaModulo } from "../../permissions/entities/conta-modulo.entity";
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

  buscarPorIdComConta(id_usuario: number) {
    return this.usuarioModel.findByPk(id_usuario, {
      include: [
        {
          model: Conta,
          as: "conta",
          attributes: { exclude: ["senha_hash"] },
          include: [{ model: ContaModulo, as: "modulos" }],
        },
      ],
    });
  }
}

