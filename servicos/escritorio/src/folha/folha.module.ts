import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AuditModule } from "../audit/audit.module";
import { AuthClientModule } from "../auth-client/auth-client.module";
import { EntidadeTipo } from "../entidades/entidade-tipo.model";
import { Entidade } from "../entidades/entidade.model";
import { Ferias } from "./ferias.model";
import { FolhaMensal } from "./folha-mensal.model";
import { FolhaController } from "./folha.controller";
import { FolhaService } from "./folha.service";
import { RegistroSalarial } from "./registro-salarial.model";

@Module({
  imports: [
    SequelizeModule.forFeature([
      Entidade,
      EntidadeTipo,
      RegistroSalarial,
      Ferias,
      FolhaMensal,
    ]),
    AuthClientModule,
    AuditModule,
  ],
  controllers: [FolhaController],
  providers: [FolhaService],
})
export class FolhaModule {}
