import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AuditoriaCore } from "./entities/auditoria-core.entity";
import { AuditRepository } from "./repositories/audit.repository";
import { AuditService } from "./services/audit.service";

@Module({
  imports: [SequelizeModule.forFeature([AuditoriaCore])],
  providers: [AuditService, AuditRepository],
  exports: [AuditService],
})
export class AuditModule {}

