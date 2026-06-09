import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AccountsModule } from "../contas/accounts.module";
import { Conta } from "../contas/entities/conta.entity";
import { AuthModule } from "../auth/auth.module";
import { ContaModulo } from "./entities/conta-modulo.entity";
import { PermissionsController } from "./controllers/permissions.controller";
import { PermissionsRepository } from "./repositories/permissions.repository";
import { PermissionsService } from "./services/permissions.service";

@Module({
  imports: [
    SequelizeModule.forFeature([ContaModulo, Conta]),
    AuthModule,
    AccountsModule,
  ],
  controllers: [PermissionsController],
  providers: [PermissionsService, PermissionsRepository],
})
export class PermissionsModule {}

