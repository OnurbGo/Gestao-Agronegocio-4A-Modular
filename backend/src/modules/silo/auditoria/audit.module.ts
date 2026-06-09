import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AuditoriaSilo } from "./entities/auditoria-silo.entity";
import { AuditRepository } from "./repositories/audit.repository";
import { AuditService } from "./services/audit.service";

@Module({
  imports: [SequelizeModule.forFeature([AuditoriaSilo])],
  providers: [AuditService, AuditRepository],
  exports: [AuditService],
})
export class AuditModule {}
