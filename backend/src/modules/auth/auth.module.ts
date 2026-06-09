import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AuditModule } from "../auditoria/audit.module";
import { Conta } from "../contas/entities/conta.entity";
import { AccountsRepository } from "../contas/repositories/accounts.repository";
import { Usuario } from "../usuarios/entities/usuario.entity";
import { ContaModulo } from "../permissoes/entities/conta-modulo.entity";
import { SolicitacaoConta } from "../contas/entities/solicitacao-conta.entity";
import { AuthController } from "./controllers/auth.controller";
import { AuthMessagesController } from "./controllers/auth-messages.controller";
import { AuthService } from "./services/auth.service";
import { CoreAuthGuard } from "./guards/core-auth.guard";
import { OptionalCoreAuthGuard } from "./guards/optional-core-auth.guard";
import { TokenService } from "./services/token.service";

@Module({
  imports: [SequelizeModule.forFeature([Conta, Usuario, ContaModulo, SolicitacaoConta]), AuditModule],
  controllers: [AuthController, AuthMessagesController],
  providers: [
    AuthService,
    TokenService,
    CoreAuthGuard,
    OptionalCoreAuthGuard,
    AccountsRepository,
  ],
  exports: [AuthService, TokenService, CoreAuthGuard, OptionalCoreAuthGuard],
})
export class AuthModule {}

