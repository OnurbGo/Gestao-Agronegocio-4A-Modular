import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AuditModule } from "../audit/audit.module";
import { AuthClientModule } from "../auth-client/auth-client.module";
import { EntidadeArquivo } from "../entidades/entities/entidade-arquivo.entity";
import { Entidade } from "../entidades/entities/entidade.entity";
import { TipoDocumento } from "../entidades/entities/tipo-documento.entity";
import { ImovelArquivo } from "../imoveis/entities/imovel-arquivo.entity";
import { Imovel } from "../imoveis/entities/imovel.entity";
import { DocumentosController } from "./controllers/documentos.controller";
import { DocumentosService } from "./services/documentos.service";
import { DocumentosRepository } from "./repositories/documentos.repository";

@Module({
  imports: [
    SequelizeModule.forFeature([
      Entidade,
      EntidadeArquivo,
      Imovel,
      ImovelArquivo,
      TipoDocumento,
    ]),
    AuthClientModule,
    AuditModule,
  ],
  controllers: [DocumentosController],
  providers: [DocumentosService, DocumentosRepository],
})
export class DocumentosModule {}

