import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { AuditoriaCore } from "../entities/auditoria-core.entity";

type CriarAuditoriaCore = {
  conta_id?: number | null;
  usuario_id?: number | null;
  acao: string;
  recurso: string;
  recurso_id?: number | null;
  valor_anterior?: object | null;
  valor_novo?: object | null;
  ip?: string | null;
};

@Injectable()
export class AuditRepository {
  constructor(
    @InjectModel(AuditoriaCore)
    private readonly auditoriaModel: typeof AuditoriaCore,
  ) {}

  criar(data: CriarAuditoriaCore) {
    return this.auditoriaModel.create({
      conta_id: data.conta_id || null,
      usuario_id: data.usuario_id || null,
      acao: data.acao,
      recurso: data.recurso,
      recurso_id: data.recurso_id || null,
      valor_anterior: data.valor_anterior || null,
      valor_novo: data.valor_novo || null,
      ip: data.ip || null,
    });
  }
}

