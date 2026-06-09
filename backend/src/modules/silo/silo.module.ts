import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AuditModule } from "./auditoria/audit.module";
import { AuthClientModule } from "./auth-client/auth-client.module";
import { CadastrosController } from "./controllers/cadastros.controller";
import { ContratosController } from "./controllers/contratos.controller";
import { DadosSaidaController } from "./controllers/dados-saida.controller";
import { DescontosController } from "./controllers/descontos.controller";
import { LotesOperacionaisController } from "./controllers/lotes-operacionais.controller";
import { PesagensController } from "./controllers/pesagens.controller";
import { RelatoriosController } from "./controllers/relatorios.controller";
import { RomaneiosController } from "./controllers/romaneios.controller";
import { SyncController } from "./controllers/sync.controller";
import { SiloRepository } from "./repositories/silo.repository";
import { SILO_MODELS } from "./silo.models";
import { CadastrosService } from "./services/cadastros.service";
import { ContratosService } from "./services/contratos.service";
import { DadosSaidaService } from "./services/dados-saida.service";
import { DescontosService } from "./services/descontos.service";
import { LotesOperacionaisService } from "./services/lotes-operacionais.service";
import { MovimentacaoService } from "./services/movimentacao.service";
import { PesagensService } from "./services/pesagens.service";
import { RelatoriosService } from "./services/relatorios.service";
import { RomaneioRangesService } from "./services/romaneio-ranges.service";
import { SyncService } from "./services/sync.service";

@Module({
  imports: [SequelizeModule.forFeature(SILO_MODELS), AuthClientModule, AuditModule],
  controllers: [
    CadastrosController,
    LotesOperacionaisController,
    PesagensController,
    DescontosController,
    ContratosController,
    DadosSaidaController,
    RelatoriosController,
    RomaneiosController,
    SyncController,
  ],
  providers: [
    SiloRepository,
    CadastrosService,
    LotesOperacionaisService,
    PesagensService,
    DescontosService,
    ContratosService,
    DadosSaidaService,
    MovimentacaoService,
    RelatoriosService,
    RomaneioRangesService,
    SyncService,
  ],
})
export class SiloModule {}
