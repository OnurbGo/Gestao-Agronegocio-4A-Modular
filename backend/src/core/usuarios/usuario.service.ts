import bcrypt from "bcrypt";
import sequelize from "../../config/database";
import ApiError from "../../shared/errors/api-error";
import RedisService from "../../shared/services/redis.service";
import AuditoriaService from "../auditoria/auditoria.service";
import { PermissaoModulo } from "../permissoes/modulo.enum";
import PermissaoService from "../permissoes/permissao.service";
import {
  AprovarSolicitacaoInput,
  AtualizarUsuarioInput,
  CriarUsuarioInput,
  RecusarSolicitacaoInput,
} from "./usuario.schema";
import UsuarioModulo from "./usuario-modulo.model";
import UsuarioSolicitacao from "./usuario-solicitacao.model";
import Usuario from "./usuario.model";

type UsuarioLogado = Express.Request["usuario"];

class UsuarioService {
  async criar(data: CriarUsuarioInput, ip?: string) {
    await this.validarEmailDisponivel(data.email);

    const totalUsuarios = await Usuario.count({ paranoid: false });

    if (totalUsuarios === 0) {
      return this.criarPrimeiroAdmin(data, ip);
    }

    return this.criarSolicitacao(data, ip);
  }

  async listar() {
    const usuarios = await Usuario.findAll({
      include: [{ model: UsuarioModulo, as: "modulos" }],
      order: [["nome", "ASC"]],
    });

    return usuarios.map((usuario) => this.sanitizarUsuario(usuario));
  }

  async buscarPorId(id_usuario: number) {
    const usuario = await Usuario.findByPk(id_usuario, {
      include: [{ model: UsuarioModulo, as: "modulos" }],
    });

    if (!usuario) {
      throw new ApiError("Usuário não encontrado.", 404);
    }

    return this.sanitizarUsuario(usuario);
  }

  async atualizar(
    id_usuario: number,
    data: AtualizarUsuarioInput,
    usuarioLogado: UsuarioLogado,
    ip?: string,
  ) {
    const usuario = await this.buscarModelPorId(id_usuario);
    await this.validarPodeAlterarUsuario(usuario, usuarioLogado);

    if (data.email && data.email !== usuario.get("email")) {
      await this.validarEmailDisponivel(data.email, id_usuario);
    }

    const valorAnterior = this.sanitizarUsuario(usuario);
    const updateData: Record<string, unknown> = { ...data };

    if (data.senha) {
      updateData.senha_hash = await this.hashSenha(data.senha);
      delete updateData.senha;
    }

    await usuario.update(updateData);

    await AuditoriaService.registrar({
      usuario_id: usuarioLogado?.id_usuario,
      acao: "USUARIO_ATUALIZADO",
      recurso: "USUARIO",
      recurso_id: id_usuario,
      valor_anterior: valorAnterior,
      valor_novo: this.sanitizarUsuario(usuario),
      ip,
    });

    return this.buscarPorId(id_usuario);
  }

  async remover(id_usuario: number, usuarioLogado: UsuarioLogado, ip?: string) {
    const usuario = await this.buscarModelPorId(id_usuario);
    await this.validarPodeAlterarUsuario(usuario, usuarioLogado);

    if (usuarioLogado?.id_usuario === id_usuario) {
      throw new ApiError("Você não pode remover o próprio usuário.", 400);
    }

    const valorAnterior = this.sanitizarUsuario(usuario);

    await usuario.update({ ativo: false });
    await usuario.destroy();

    await AuditoriaService.registrar({
      usuario_id: usuarioLogado?.id_usuario,
      acao: "USUARIO_REMOVIDO",
      recurso: "USUARIO",
      recurso_id: id_usuario,
      valor_anterior: valorAnterior,
      ip,
    });
  }

  async listarSolicitacoes(status?: "PENDENTE" | "APROVADA" | "RECUSADA") {
    const where = status ? { status } : undefined;
    const solicitacoes = await UsuarioSolicitacao.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    return solicitacoes.map((solicitacao) =>
      this.sanitizarSolicitacao(solicitacao),
    );
  }

  async aprovarSolicitacao(
    id_solicitacao: number,
    data: AprovarSolicitacaoInput,
    usuarioLogado: UsuarioLogado,
    ip?: string,
  ) {
    PermissaoService.validarPodeAprovarSolicitacao(usuarioLogado);

    const solicitacao = await this.buscarSolicitacaoPendente(id_solicitacao);
    const email = solicitacao.get("email") as string;
    const usuarioExistente = await Usuario.findOne({
      where: { email },
      paranoid: false,
    });

    if (usuarioExistente) {
      throw new ApiError("Já existe um usuário com este e-mail.", 400);
    }

    const modulos = this.resolverModulosAprovacao(solicitacao, data);
    PermissaoService.validarPodeConcederModulos(usuarioLogado, modulos);

    const usuario = await sequelize.transaction(async (transaction) => {
      const novoUsuario = await Usuario.create(
        {
          nome: solicitacao.get("nome"),
          email,
          senha_hash: solicitacao.get("senha_hash"),
          observacao: solicitacao.get("observacao"),
          ativo: true,
        },
        { transaction },
      );

      await solicitacao.update(
        {
          status: "APROVADA",
          aprovado_por_usuario_id: usuarioLogado?.id_usuario,
          aprovado_em: new Date(),
        },
        { transaction },
      );

      return novoUsuario;
    });

    const permissoes = await PermissaoService.salvarSemValidacao(
      usuario.get("id_usuario") as number,
      modulos,
    );

    await AuditoriaService.registrar({
      usuario_id: usuarioLogado?.id_usuario,
      acao: "SOLICITACAO_USUARIO_APROVADA",
      recurso: "USUARIO_SOLICITACAO",
      recurso_id: id_solicitacao,
      valor_novo: {
        usuario: this.sanitizarUsuario(usuario),
        modulos: permissoes,
      },
      ip,
    });

    return {
      ...this.sanitizarUsuario(usuario),
      modulos: permissoes,
    };
  }

  async recusarSolicitacao(
    id_solicitacao: number,
    data: RecusarSolicitacaoInput,
    usuarioLogado: UsuarioLogado,
    ip?: string,
  ) {
    PermissaoService.validarPodeAprovarSolicitacao(usuarioLogado);

    const solicitacao = await this.buscarSolicitacaoPendente(id_solicitacao);
    const valorAnterior = this.sanitizarSolicitacao(solicitacao);

    await solicitacao.update({
      status: "RECUSADA",
      recusado_por_usuario_id: usuarioLogado?.id_usuario,
      recusado_em: new Date(),
      motivo_recusa: data.motivo_recusa || null,
    });

    await AuditoriaService.registrar({
      usuario_id: usuarioLogado?.id_usuario,
      acao: "SOLICITACAO_USUARIO_RECUSADA",
      recurso: "USUARIO_SOLICITACAO",
      recurso_id: id_solicitacao,
      valor_anterior: valorAnterior,
      valor_novo: this.sanitizarSolicitacao(solicitacao),
      ip,
    });

    return this.sanitizarSolicitacao(solicitacao);
  }

  private async criarPrimeiroAdmin(data: CriarUsuarioInput, ip?: string) {
    const senha_hash = await this.hashSenha(data.senha);

    const usuario = await sequelize.transaction(async (transaction) => {
      const novoUsuario = await Usuario.create(
        {
          nome: data.nome,
          email: data.email,
          senha_hash,
          observacao: data.observacao || null,
          ativo: true,
        },
        { transaction },
      );

      return novoUsuario;
    });

    const modulos = await PermissaoService.salvarSemValidacao(
      usuario.get("id_usuario") as number,
      [this.permissaoEspecial("ADMIN")],
    );

    await AuditoriaService.registrar({
      usuario_id: usuario.get("id_usuario") as number,
      acao: "PRIMEIRO_ADMIN_CRIADO",
      recurso: "USUARIO",
      recurso_id: usuario.get("id_usuario") as number,
      valor_novo: {
        usuario: this.sanitizarUsuario(usuario),
        modulos,
      },
      ip,
    });

    return {
      statusCode: 201,
      message: "Primeiro usuário ADMIN criado com sucesso.",
      data: {
        usuario: {
          ...this.sanitizarUsuario(usuario),
          modulos,
        },
      },
    };
  }

  private async criarSolicitacao(data: CriarUsuarioInput, ip?: string) {
    const senha_hash = await this.hashSenha(data.senha);

    const solicitacao = await UsuarioSolicitacao.create({
      nome: data.nome,
      email: data.email,
      senha_hash,
      observacao: data.observacao || null,
      modulos_solicitados: data.modulos,
      status: "PENDENTE",
    });

    const solicitacaoSegura = this.sanitizarSolicitacao(solicitacao);

    await RedisService.publish("usuarios:solicitacoes", solicitacaoSegura);

    await AuditoriaService.registrar({
      acao: "SOLICITACAO_USUARIO_CRIADA",
      recurso: "USUARIO_SOLICITACAO",
      recurso_id: solicitacao.get("id_usuario_solicitacao") as number,
      valor_novo: solicitacaoSegura,
      ip,
    });

    return {
      statusCode: 202,
      message: "Solicitação de usuário enviada para aprovação.",
      data: solicitacaoSegura,
    };
  }

  private async validarEmailDisponivel(email: string, ignorarUsuarioId?: number) {
    const usuario = await Usuario.findOne({
      where: { email },
      paranoid: false,
    });

    if (
      usuario &&
      (!ignorarUsuarioId ||
        (usuario.get("id_usuario") as number) !== ignorarUsuarioId)
    ) {
      throw new ApiError("Já existe um usuário com este e-mail.", 400);
    }

    const solicitacaoPendente = await UsuarioSolicitacao.findOne({
      where: {
        email,
        status: "PENDENTE",
      },
    });

    if (solicitacaoPendente) {
      throw new ApiError(
        "Já existe uma solicitação pendente para este e-mail.",
        400,
      );
    }
  }

  private async buscarModelPorId(id_usuario: number) {
    const usuario = await Usuario.findByPk(id_usuario, {
      include: [{ model: UsuarioModulo, as: "modulos" }],
    });

    if (!usuario) {
      throw new ApiError("Usuário não encontrado.", 404);
    }

    return usuario;
  }

  private async buscarSolicitacaoPendente(id_solicitacao: number) {
    const solicitacao = await UsuarioSolicitacao.findByPk(id_solicitacao);

    if (!solicitacao) {
      throw new ApiError("Solicitação não encontrada.", 404);
    }

    if (solicitacao.get("status") !== "PENDENTE") {
      throw new ApiError("Solicitação já foi analisada.", 400);
    }

    return solicitacao;
  }

  private async validarPodeAlterarUsuario(
    usuario: Usuario,
    usuarioLogado: UsuarioLogado,
  ) {
    if (!usuarioLogado) {
      throw new ApiError("Autenticação obrigatória.", 401);
    }

    if (usuarioLogado.possuiAdmin) {
      return;
    }

    const modulos = await UsuarioModulo.findAll({
      where: { usuario_id: usuario.get("id_usuario") },
    });
    const alvoEhAdmin = modulos.some(
      (permissao) => permissao.get("modulo") === "ADMIN",
    );

    if (alvoEhAdmin) {
      throw new ApiError("GERENTE não pode alterar usuários ADMIN.", 403);
    }
  }

  private resolverModulosAprovacao(
    solicitacao: UsuarioSolicitacao,
    data: AprovarSolicitacaoInput,
  ) {
    const solicitados =
      (solicitacao.get("modulos_solicitados") as PermissaoModulo[] | null) ||
      [];

    if (data.modulos && data.modulos.length > 0) {
      return data.modulos;
    }

    if (solicitados.length > 0) {
      return solicitados;
    }

    return [
      {
        modulo: "ESCRITORIO",
        pode_visualizar: true,
        pode_criar: false,
        pode_editar: false,
        pode_excluir: false,
        pode_restaurar: false,
      } as PermissaoModulo,
    ];
  }

  private permissaoEspecial(modulo: "ADMIN" | "GERENTE") {
    return {
      modulo,
      pode_visualizar: true,
      pode_criar: true,
      pode_editar: true,
      pode_excluir: true,
      pode_restaurar: true,
    } as PermissaoModulo;
  }

  private async hashSenha(senha: string) {
    return bcrypt.hash(senha, 10);
  }

  private sanitizarUsuario(usuario: Usuario) {
    const plain = usuario.get({ plain: true }) as Record<string, unknown>;
    delete plain.senha_hash;
    return plain;
  }

  private sanitizarSolicitacao(solicitacao: UsuarioSolicitacao) {
    const plain = solicitacao.get({ plain: true }) as Record<string, unknown>;
    delete plain.senha_hash;
    return plain;
  }
}

export default new UsuarioService();
