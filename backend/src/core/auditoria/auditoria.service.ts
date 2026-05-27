import Auditoria from "./auditoria.model";

type RegistrarAuditoriaData = {
  usuario_id?: number | null;
  acao: string;
  recurso: string;
  recurso_id?: number | null;
  valor_anterior?: object | null;
  valor_novo?: object | null;
  ip?: string | null;
};

class AuditoriaService {
  async registrar(data: RegistrarAuditoriaData) {
    try {
      await Auditoria.create({
        usuario_id: data.usuario_id || null,
        acao: data.acao,
        recurso: data.recurso,
        recurso_id: data.recurso_id || null,
        valor_anterior: data.valor_anterior || null,
        valor_novo: data.valor_novo || null,
        ip: data.ip || null,
      });
    } catch (error) {
      console.error("Não foi possível registrar auditoria:", error);
    }
  }

  async listar(limite = 100) {
    return Auditoria.findAll({
      order: [["data_hora", "DESC"]],
      limit: limite,
    });
  }
}

export default new AuditoriaService();
