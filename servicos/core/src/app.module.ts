import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AuthModule } from "./auth/auth.module";
import { AccountsModule } from "./accounts/accounts.module";
import { UsersModule } from "./users/users.module";
import { PermissionsModule } from "./permissions/permissions.module";
import { AuditModule } from "./audit/audit.module";
import { Conta } from "./accounts/conta.model";
import { ContaModulo } from "./permissions/conta-modulo.model";
import { Usuario } from "./users/usuario.model";
import { SolicitacaoConta } from "./accounts/solicitacao-conta.model";
import { AuditoriaCore } from "./audit/auditoria-core.model";

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: "mysql",
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      models: [Usuario, Conta, ContaModulo, SolicitacaoConta, AuditoriaCore],
      autoLoadModels: true,
      synchronize: process.env.DB_SYNC_ALTER === "true",
      sync: { alter: process.env.DB_SYNC_ALTER === "true" },
      logging: process.env.DB_LOGGING === "true" ? console.log : false,
    }),
    AuthModule,
    AccountsModule,
    UsersModule,
    PermissionsModule,
    AuditModule,
  ],
})
export class AppModule {}
