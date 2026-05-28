import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AuditModule } from "../audit/audit.module";
import { AuthClientModule } from "../auth-client/auth-client.module";
import { EntidadeArquivo } from "../entidades/entidade-arquivo.model";
import { Entidade } from "../entidades/entidade.model";
import { TipoDocumento } from "../entidades/tipo-documento.model";
import { ImovelArquivo } from "../imoveis/imovel-arquivo.model";
import { Imovel } from "../imoveis/imovel.model";
import { DocumentosController } from "./documentos.controller";
import { DocumentosService } from "./documentos.service";

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
  providers: [DocumentosService],
})
export class DocumentosModule {}
