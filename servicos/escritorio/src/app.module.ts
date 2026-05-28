import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AuthClientModule } from "./auth-client/auth-client.module";
import { EntidadesModule } from "./entidades/entidades.module";
import { FolhaModule } from "./folha/folha.module";
import { ImoveisModule } from "./imoveis/imoveis.module";
import { DocumentosModule } from "./documentos/documentos.module";
import { AuditModule } from "./audit/audit.module";
import { Entidade } from "./entidades/entidade.model";
import { EntidadeTipo } from "./entidades/entidade-tipo.model";
import { EntidadeArquivo } from "./entidades/entidade-arquivo.model";
import { TipoDocumento } from "./entidades/tipo-documento.model";
import { Imovel } from "./imoveis/imovel.model";
import { ImovelArquivo } from "./imoveis/imovel-arquivo.model";
// Contrato model removed (moved to separate microsserviço)
import { RegistroSalarial } from "./folha/registro-salarial.model";
import { Ferias } from "./folha/ferias.model";
import { FolhaMensal } from "./folha/folha-mensal.model";
import { AuditoriaEscritorio } from "./audit/auditoria-escritorio.model";

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: "mysql",
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      models: [
        Entidade,
        EntidadeTipo,
        EntidadeArquivo,
        TipoDocumento,
        Imovel,
        ImovelArquivo,
        RegistroSalarial,
        Ferias,
        FolhaMensal,
        AuditoriaEscritorio,
      ],
      autoLoadModels: true,
      synchronize: process.env.DB_SYNC_ALTER === "true",
      sync: { alter: process.env.DB_SYNC_ALTER === "true" },
      logging: process.env.DB_LOGGING === "true" ? console.log : false,
    }),
    AuthClientModule,
    AuditModule,
    EntidadesModule,
    ImoveisModule,
    DocumentosModule,
    FolhaModule,
  ],
})
export class AppModule {}
