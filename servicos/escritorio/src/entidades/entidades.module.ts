import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AuditModule } from "../audit/audit.module";
import { AuthClientModule } from "../auth-client/auth-client.module";
import { EntidadeArquivo } from "./entidade-arquivo.model";
import { EntidadeTipo } from "./entidade-tipo.model";
import { Entidade } from "./entidade.model";
import { TipoDocumento } from "./tipo-documento.model";
import { EntidadesController } from "./entidades.controller";
import { EntidadesService } from "./entidades.service";

@Module({
  imports: [
    SequelizeModule.forFeature([
      Entidade,
      EntidadeTipo,
      EntidadeArquivo,
      TipoDocumento,
    ]),
    AuthClientModule,
    AuditModule,
  ],
  controllers: [EntidadesController],
  providers: [EntidadesService],
  exports: [EntidadesService],
})
export class EntidadesModule {}
