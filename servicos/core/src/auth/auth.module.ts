import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AuditModule } from "../audit/audit.module";
import { Conta } from "../accounts/conta.model";
import { Usuario } from "../users/usuario.model";
import { ContaModulo } from "../permissions/conta-modulo.model";
import { AuthController } from "./auth.controller";
import { AuthMessagesController } from "./auth.messages";
import { AuthService } from "./auth.service";
import { CoreAuthGuard } from "./core-auth.guard";
import { OptionalCoreAuthGuard } from "./optional-core-auth.guard";
import { TokenService } from "./token.service";

@Module({
  imports: [SequelizeModule.forFeature([Conta, Usuario, ContaModulo]), AuditModule],
  controllers: [AuthController, AuthMessagesController],
  providers: [AuthService, TokenService, CoreAuthGuard, OptionalCoreAuthGuard],
  exports: [AuthService, TokenService, CoreAuthGuard, OptionalCoreAuthGuard],
})
export class AuthModule {}
