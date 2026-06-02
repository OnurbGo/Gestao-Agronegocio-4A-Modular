import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AuthClientModule } from "./auth-client/auth-client.module";
import { EntidadesModule } from "./entidades/entidades.module";
import { FolhaModule } from "./folha/folha.module";
import { ImoveisModule } from "./imoveis/imoveis.module";
import { DocumentosModule } from "./documentos/documentos.module";
import { AuditModule } from "./audit/audit.module";
import { Entidade } from "./entidades/entities/entidade.entity";
import { EntidadeTipo } from "./entidades/entities/entidade-tipo.entity";
import { EntidadeArquivo } from "./entidades/entities/entidade-arquivo.entity";
import { TipoDocumento } from "./entidades/entities/tipo-documento.entity";
import { Imovel } from "./imoveis/entities/imovel.entity";
import { ImovelArquivo } from "./imoveis/entities/imovel-arquivo.entity";
import { ImovelProprietario } from "./imoveis/entities/imovel-proprietario.entity";
// Contrato model removed (moved to separate microsserviço)
import { RegistroSalarial } from "./folha/entities/registro-salarial.entity";
import { Ferias } from "./folha/entities/ferias.entity";
import { FolhaMensal } from "./folha/entities/folha-mensal.entity";
import { AuditoriaEscritorio } from "./audit/entities/auditoria-escritorio.entity";

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
        ImovelProprietario,
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

