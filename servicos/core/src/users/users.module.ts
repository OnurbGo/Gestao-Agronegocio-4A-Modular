import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AuthModule } from "../auth/auth.module";
import { Usuario } from "./usuario.model";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  imports: [SequelizeModule.forFeature([Usuario]), AuthModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
