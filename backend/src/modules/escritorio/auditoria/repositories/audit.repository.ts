import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { AuditoriaEscritorio } from "../entities/auditoria-escritorio.entity";

type CriarAuditoriaEscritorio = {
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
    @InjectModel(AuditoriaEscritorio)
    private readonly auditoriaModel: typeof AuditoriaEscritorio,
  ) {}

  criar(data: CriarAuditoriaEscritorio) {
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

