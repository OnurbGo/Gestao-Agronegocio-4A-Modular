import { Module } from "@nestjs/common";
import { RouterModule } from "@nestjs/core";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AccountsModule } from "./modules/contas/accounts.module";
import { PermissionsModule } from "./modules/permissoes/permissions.module";
import { UsersModule } from "./modules/usuarios/users.module";
import { AuditModule } from "./modules/auditoria/audit.module";
import { DocumentosModule } from "./modules/escritorio/documentos/documentos.module";
import { EntidadesModule } from "./modules/escritorio/entidades/entidades.module";
import { FolhaModule } from "./modules/escritorio/folha/folha.module";
import { ImoveisModule } from "./modules/escritorio/imoveis/imoveis.module";
import { SiloModule } from "./modules/silo/silo.module";

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    AccountsModule,
    UsersModule,
    PermissionsModule,
    AuditModule,
    EntidadesModule,
    ImoveisModule,
    DocumentosModule,
    FolhaModule,
    SiloModule,
    RouterModule.register([
      { path: "core", module: AuthModule },
      { path: "core", module: AccountsModule },
      { path: "core", module: UsersModule },
      { path: "core", module: PermissionsModule },
      { path: "escritorio", module: EntidadesModule },
      { path: "escritorio", module: ImoveisModule },
      { path: "escritorio", module: DocumentosModule },
      { path: "escritorio", module: FolhaModule },
      { path: "silo", module: SiloModule },
    ]),
  ],
})
export class AppModule {}
