import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { ContaModulo } from "../permissions/entities/conta-modulo.entity";
import { Usuario } from "../users/entities/usuario.entity";
import { Conta } from "./entities/conta.entity";
import { SolicitacaoConta } from "./entities/solicitacao-conta.entity";
import { AccountsController } from "./controllers/accounts.controller";
import { AccountsRepository } from "./repositories/accounts.repository";
import { AccountsEventsService } from "./services/accounts-events.service";
import { AccountsService } from "./services/accounts.service";

@Module({
  imports: [
    SequelizeModule.forFeature([Conta, Usuario, ContaModulo, SolicitacaoConta]),
    AuditModule,
    AuthModule,
  ],
  controllers: [AccountsController],
  providers: [AccountsService, AccountsEventsService, AccountsRepository],
  exports: [AccountsEventsService],
})
export class AccountsModule {}

