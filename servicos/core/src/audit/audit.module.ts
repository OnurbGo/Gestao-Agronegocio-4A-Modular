import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AuditoriaCore } from "./auditoria-core.model";
import { AuditService } from "./audit.service";

@Module({
  imports: [SequelizeModule.forFeature([AuditoriaCore])],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
