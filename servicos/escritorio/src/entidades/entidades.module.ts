import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AuditModule } from "../audit/audit.module";
import { AuthClientModule } from "../auth-client/auth-client.module";
import { EntidadeArquivo } from "./entities/entidade-arquivo.entity";
import { EntidadeTipo } from "./entities/entidade-tipo.entity";
import { Entidade } from "./entities/entidade.entity";
import { TipoDocumento } from "./entities/tipo-documento.entity";
import { EntidadesController } from "./controllers/entidades.controller";
import { EntidadesService } from "./services/entidades.service";
import { EntidadesRepository } from "./repositories/entidades.repository";

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
  providers: [EntidadesService, EntidadesRepository],
  exports: [EntidadesService],
})
export class EntidadesModule {}

