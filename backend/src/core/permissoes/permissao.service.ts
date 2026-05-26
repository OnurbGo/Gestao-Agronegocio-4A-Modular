import sequelize from "../../config/database";
import ApiError from "../../shared/errors/api-error";
import AuditoriaService from "../auditoria/auditoria.service";
import UsuarioModulo from "../usuarios/usuario-modulo.model";
import {
  Modulo,
  PermissaoModulo,
  isModuloNegocio,
} from "./modulo.enum";

type UsuarioLogado = Express.Request["usuario"];

class PermissaoService {
  async listarPorUsuario(usuario_id: number) {
    const permissoes = await UsuarioModulo.findAll({
      where: { usuario_id },
      order: [["modulo", "ASC"]],
    });

    return permissoes.map((permissao) => this.toPlain(permissao));
  }

  async salvar(
    usuario_id: number,
    modulos: PermissaoModulo[],
    usuarioLogado: UsuarioLogado,
    ip?: string,
  ) {
    this.validarPodeConcederModulos(usuarioLogado, modulos);

    const anteriores = await this.listarPorUsuario(usuario_id);
    const novas = await this.substituirPermissoes(usuario_id, modulos);

    await AuditoriaService.registrar({
      usuario_id: usuarioLogado?.id_usuario,
      acao: "PERMISSOES_ALTERADAS",
      recurso: "USUARIO",
      recurso_id: usuario_id,
      valor_anterior: { modulos: anteriores },
      valor_novo: { modulos: novas },
      ip,
    });

    return novas;
  }

  async salvarSemValidacao(usuario_id: number, modulos: PermissaoModulo[]) {
    return this.substituirPermissoes(usuario_id, modulos);
  }

  validarPodeAprovarSolicitacao(usuarioLogado: UsuarioLogado) {
    if (!usuarioLogado) {
      throw new ApiError("Autenticação obrigatória.", 401);
    }

    if (usuarioLogado.possuiAdmin || usuarioLogado.possuiGerente) {
      return;
    }

    throw new ApiError("Você não tem permissão para executar esta ação.", 403);
  }

  validarPodeConcederModulos(
    usuarioLogado: UsuarioLogado,
    modulos: PermissaoModulo[],
  ) {
    if (!usuarioLogado) {
      throw new ApiError("Autenticação obrigatória.", 401);
    }

    if (usuarioLogado.possuiAdmin) {
      return;
    }

    if (!usuarioLogado.possuiGerente) {
      throw new ApiError("Você não tem permissão para executar esta ação.", 403);
    }

    const tentaConcederAdmin = modulos.some(
      (permissao) => permissao.modulo === "ADMIN",
    );

    if (tentaConcederAdmin) {
      throw new ApiError(
        "GERENTE não pode conceder ou remover acesso ADMIN.",
        403,
      );
    }
  }

  possuiModulo(permissoes: PermissaoModulo[], modulo: Modulo) {
    return permissoes.some((permissao) => permissao.modulo === modulo);
  }

  gerentePodeAcessarModulo(modulo: Modulo) {
    return modulo === "GERENTE" || isModuloNegocio(modulo);
  }

  private async substituirPermissoes(
    usuario_id: number,
    modulos: PermissaoModulo[],
  ) {
    const permissoes = this.normalizarPermissoes(modulos);

    await sequelize.transaction(async (transaction) => {
      await UsuarioModulo.destroy({
        where: { usuario_id },
        transaction,
      });

      if (permissoes.length > 0) {
        await UsuarioModulo.bulkCreate(
          permissoes.map((permissao) => ({
            usuario_id,
            ...permissao,
          })),
          { transaction },
        );
      }
    });

    return this.listarPorUsuario(usuario_id);
  }

  private normalizarPermissoes(modulos: PermissaoModulo[]) {
    const porModulo = new Map<Modulo, PermissaoModulo>();

    for (const permissao of modulos) {
      if (permissao.modulo === "ADMIN" || permissao.modulo === "GERENTE") {
        porModulo.set(permissao.modulo, {
          modulo: permissao.modulo,
          pode_visualizar: true,
          pode_criar: true,
          pode_editar: true,
          pode_excluir: true,
          pode_restaurar: true,
        });
        continue;
      }

      porModulo.set(permissao.modulo, {
        modulo: permissao.modulo,
        pode_visualizar: permissao.pode_visualizar ?? true,
        pode_criar: permissao.pode_criar ?? false,
        pode_editar: permissao.pode_editar ?? false,
        pode_excluir: permissao.pode_excluir ?? false,
        pode_restaurar: permissao.pode_restaurar ?? false,
      });
    }

    return Array.from(porModulo.values());
  }

  private toPlain(permissao: UsuarioModulo) {
    const plain = permissao.get({ plain: true }) as PermissaoModulo;

    return {
      id_usuario_modulo: plain.id_usuario_modulo,
      usuario_id: plain.usuario_id,
      modulo: plain.modulo,
      pode_visualizar: plain.pode_visualizar,
      pode_criar: plain.pode_criar,
      pode_editar: plain.pode_editar,
      pode_excluir: plain.pode_excluir,
      pode_restaurar: plain.pode_restaurar,
    };
  }
}

export default new PermissaoService();
