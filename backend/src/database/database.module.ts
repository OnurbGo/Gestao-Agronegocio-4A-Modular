import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Conta } from "../modules/contas/entities/conta.entity";
import { SolicitacaoConta } from "../modules/contas/entities/solicitacao-conta.entity";
import { ContaModulo } from "../modules/permissoes/entities/conta-modulo.entity";
import { Usuario } from "../modules/usuarios/entities/usuario.entity";
import { AuditoriaCore } from "../modules/auditoria/entities/auditoria-core.entity";
import { AuditoriaEscritorio } from "../modules/escritorio/auditoria/entities/auditoria-escritorio.entity";
import { EntidadeArquivo } from "../modules/escritorio/entidades/entities/entidade-arquivo.entity";
import { EntidadeTipo } from "../modules/escritorio/entidades/entities/entidade-tipo.entity";
import { Entidade } from "../modules/escritorio/entidades/entities/entidade.entity";
import { TipoDocumento } from "../modules/escritorio/entidades/entities/tipo-documento.entity";
import { Ferias } from "../modules/escritorio/folha/entities/ferias.entity";
import { FolhaMensal } from "../modules/escritorio/folha/entities/folha-mensal.entity";
import { RegistroSalarial } from "../modules/escritorio/folha/entities/registro-salarial.entity";
import { ImovelArquivo } from "../modules/escritorio/imoveis/entities/imovel-arquivo.entity";
import { ImovelProprietario } from "../modules/escritorio/imoveis/entities/imovel-proprietario.entity";
import { Imovel } from "../modules/escritorio/imoveis/entities/imovel.entity";
import { SILO_MODELS } from "../modules/silo/silo.models";

export const DATABASE_MODELS = [
  Usuario,
  Conta,
  ContaModulo,
  SolicitacaoConta,
  AuditoriaCore,
  AuditoriaEscritorio,
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
  ...SILO_MODELS,
];

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: "mysql",
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 3306),
      username: process.env.DB_USER || "root",
      password: process.env.DB_PASS || "",
      database: process.env.DB_NAME || "gestao_agro",
      models: DATABASE_MODELS,
      autoLoadModels: true,
      synchronize: process.env.DB_SYNC_ALTER === "true",
      sync: { alter: process.env.DB_SYNC_ALTER === "true" },
      logging: process.env.DB_LOGGING === "true" ? console.log : false,
    }),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule {}
