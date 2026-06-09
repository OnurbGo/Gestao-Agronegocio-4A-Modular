import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AuditoriaEscritorio } from "./entities/auditoria-escritorio.entity";
import { AuditService } from "./services/audit.service";
import { AuditRepository } from "./repositories/audit.repository";

@Module({
  imports: [SequelizeModule.forFeature([AuditoriaEscritorio])],
  providers: [AuditService, AuditRepository],
  exports: [AuditService],
})
export class AuditModule {}

