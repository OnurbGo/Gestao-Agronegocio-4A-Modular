import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { AuditoriaCore } from "./auditoria-core.model";

type RegistrarAuditoria = {
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
export class AuditService {
  constructor(
    @InjectModel(AuditoriaCore)
    private readonly auditoriaModel: typeof AuditoriaCore,
  ) {}

  async registrar(data: RegistrarAuditoria) {
    try {
      await this.auditoriaModel.create({
        conta_id: data.conta_id || null,
        usuario_id: data.usuario_id || null,
        acao: data.acao,
        recurso: data.recurso,
        recurso_id: data.recurso_id || null,
        valor_anterior: data.valor_anterior || null,
        valor_novo: data.valor_novo || null,
        ip: data.ip || null,
      });
    } catch (error) {
      console.error("Nao foi possivel registrar auditoria core:", error);
    }
  }
}
