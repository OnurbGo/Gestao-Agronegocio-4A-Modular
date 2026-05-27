import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AuditModule } from "../audit/audit.module";
import { AuthClientModule } from "../auth-client/auth-client.module";
import { Entidade } from "../entidades/entidade.model";
import { ImovelArquivo } from "./imovel-arquivo.model";
import { Imovel } from "./imovel.model";
import { ImoveisController } from "./imoveis.controller";
import { ImoveisService } from "./imoveis.service";

@Module({
  imports: [
    SequelizeModule.forFeature([Imovel, ImovelArquivo, Entidade]),
    AuthClientModule,
    AuditModule,
  ],
  controllers: [ImoveisController],
  providers: [ImoveisService],
  exports: [ImoveisService],
})
export class ImoveisModule {}
