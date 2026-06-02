import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AuditModule } from "../audit/audit.module";
import { AuthClientModule } from "../auth-client/auth-client.module";
import { Entidade } from "../entidades/entities/entidade.entity";
import { ImovelArquivo } from "./entities/imovel-arquivo.entity";
import { ImovelProprietario } from "./entities/imovel-proprietario.entity";
import { Imovel } from "./entities/imovel.entity";
import { ImoveisController } from "./controllers/imoveis.controller";
import { ImoveisService } from "./services/imoveis.service";
import { ImoveisRepository } from "./repositories/imoveis.repository";

@Module({
  imports: [
    SequelizeModule.forFeature([Imovel, ImovelArquivo, ImovelProprietario, Entidade]),
    AuthClientModule,
    AuditModule,
  ],
  controllers: [ImoveisController],
  providers: [ImoveisService, ImoveisRepository],
  exports: [ImoveisService],
})
export class ImoveisModule {}

