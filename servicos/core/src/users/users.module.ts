import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AuthModule } from "../auth/auth.module";
import { Usuario } from "./entities/usuario.entity";
import { UsersController } from "./controllers/users.controller";
import { UsersRepository } from "./repositories/users.repository";
import { UsersService } from "./services/users.service";

@Module({
  imports: [SequelizeModule.forFeature([Usuario]), AuthModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
})
export class UsersModule {}

