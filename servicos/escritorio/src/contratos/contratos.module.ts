import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AuditModule } from "../audit/audit.module";
import { AuthClientModule } from "../auth-client/auth-client.module";
import { Entidade } from "../entidades/entidade.model";
import { Imovel } from "../imoveis/imovel.model";
import { Contrato } from "./contrato.model";
import { ContratosController } from "./contratos.controller";
import { ContratosService } from "./contratos.service";

@Module({
  imports: [
    SequelizeModule.forFeature([Contrato, Entidade, Imovel]),
    AuthClientModule,
    AuditModule,
  ],
  controllers: [ContratosController],
  providers: [ContratosService],
})
export class ContratosModule {}
