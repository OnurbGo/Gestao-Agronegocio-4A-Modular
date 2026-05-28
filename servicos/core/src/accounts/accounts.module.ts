import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { ContaModulo } from "../permissions/conta-modulo.model";
import { Usuario } from "../users/usuario.model";
import { Conta } from "./conta.model";
import { SolicitacaoConta } from "./solicitacao-conta.model";
import { AccountsController } from "./accounts.controller";
import { AccountsEventsService } from "./accounts.events";
import { AccountsService } from "./accounts.service";

@Module({
  imports: [
    SequelizeModule.forFeature([Conta, Usuario, ContaModulo, SolicitacaoConta]),
    AuditModule,
    AuthModule,
  ],
  controllers: [AccountsController],
  providers: [AccountsService, AccountsEventsService],
  exports: [AccountsEventsService],
})
export class AccountsModule {}
