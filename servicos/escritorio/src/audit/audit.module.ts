import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AuditoriaEscritorio } from "./auditoria-escritorio.model";
import { AuditService } from "./audit.service";

@Module({
  imports: [SequelizeModule.forFeature([AuditoriaEscritorio])],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
