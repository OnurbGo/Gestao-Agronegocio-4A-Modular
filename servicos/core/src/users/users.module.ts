import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Conta } from "../accounts/entities/conta.entity";
import { AuthModule } from "../auth/auth.module";
import { ContaModulo } from "../permissions/entities/conta-modulo.entity";
import { Usuario } from "./entities/usuario.entity";
import { UsersController } from "./controllers/users.controller";
import { UsersRepository } from "./repositories/users.repository";
import { UsersService } from "./services/users.service";

@Module({
  imports: [SequelizeModule.forFeature([Usuario, Conta, ContaModulo]), AuthModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
})
export class UsersModule {}

