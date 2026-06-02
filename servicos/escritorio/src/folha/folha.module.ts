import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AuditModule } from "../audit/audit.module";
import { AuthClientModule } from "../auth-client/auth-client.module";
import { EntidadeTipo } from "../entidades/entities/entidade-tipo.entity";
import { Entidade } from "../entidades/entities/entidade.entity";
import { Ferias } from "./entities/ferias.entity";
import { FolhaMensal } from "./entities/folha-mensal.entity";
import { FolhaController } from "./controllers/folha.controller";
import { FolhaService } from "./services/folha.service";
import { RegistroSalarial } from "./entities/registro-salarial.entity";
import { FolhaRepository } from "./repositories/folha.repository";

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
  providers: [FolhaService, FolhaRepository],
})
export class FolhaModule {}

