import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { createReadStream } from "fs";
import { mkdir, stat, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { AuditService } from "../../audit/services/audit.service";
import { AuthContext } from "../../auth-client/types/auth.types";
import { EntidadeArquivo } from "../../entidades/entities/entidade-arquivo.entity";
import { ImovelArquivo } from "../../imoveis/entities/imovel-arquivo.entity";
import { ArquivoOrigem, UploadArquivoInput } from "../dto/documentos.dto";
import { DocumentosRepository } from "../repositories/documentos.repository";

type UploadedFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
};

type ArquivoResolvido =
  | { origem: "ENTIDADE"; arquivo: EntidadeArquivo }
  | { origem: "IMOVEL"; arquivo: ImovelArquivo };

const tiposPadrao = [
  { nome: "Documento pessoal", categoria: "PESSOAL", tipo_pessoa_aplicavel: "FISICA" },
  {
    nome: "Documento empresarial",
    categoria: "EMPRESARIAL",
    tipo_pessoa_aplicavel: "JURIDICA",
  },
  { nome: "Matricula do imovel", categoria: "RURAL", tipo_pessoa_aplicavel: "AMBAS" },
  { nome: "Contrato", categoria: "CONTRATUAL", tipo_pessoa_aplicavel: "AMBAS" },
  { nome: "Outros", categoria: "OUTROS", tipo_pessoa_aplicavel: "AMBAS" },
];

@Injectable()
export class DocumentosService {
  constructor(
    private readonly documentosRepository: DocumentosRepository,
    private readonly auditService: AuditService,
  ) {}

  async listarTiposDocumento() {
    await this.garantirTiposPadrao();

    return this.documentosRepository.listarTiposDocumentoAtivos();
  }

  async listarArquivosEntidade(id_entidade: number) {
    await this.validarEntidade(id_entidade);

    return this.documentosRepository.listarArquivosEntidade(id_entidade);
  }

  async listarArquivosImovel(id_imovel: number) {
    await this.validarImovel(id_imovel);

    return this.documentosRepository.listarArquivosImovel(id_imovel);
  }

  async salvarArquivoEntidade(
    id_entidade: number,
    data: UploadArquivoInput,
    file: UploadedFile | undefined,
    usuario: AuthContext,
    ip?: string,
  ) {
    await this.validarEntidade(id_entidade);
    await this.validarUpload(data, file);
    const salvo = await this.gravarArquivo("entidades", id_entidade, file!);

    const arquivo = await this.documentosRepository.criarArquivoEntidade({
      entidade_id: id_entidade,
      tipo_documento_id: data.tipo_documento_id,
      nome_original: file!.originalname,
      nome_arquivo: salvo.nome_arquivo,
      caminho: salvo.caminho,
      tipo_mime: file!.mimetype,
      tamanho: file!.size,
      observacao: data.observacao,
      enviado_por_usuario_id: usuario.usuario_id,
      ativo: true,
    });

    await this.registrarAuditoria(
      usuario,
      "ENTIDADE_ARQUIVO_CRIADO",
      "ENTIDADE_ARQUIVO",
      arquivo.id_entidade_arquivo,
      arquivo.get({ plain: true }),
      ip,
    );

    return arquivo;
  }

  async salvarArquivoImovel(
    id_imovel: number,
    data: UploadArquivoInput,
    file: UploadedFile | undefined,
    usuario: AuthContext,
    ip?: string,
  ) {
    await this.validarImovel(id_imovel);
    await this.validarUpload(data, file);
    const salvo = await this.gravarArquivo("imoveis", id_imovel, file!);

    const arquivo = await this.documentosRepository.criarArquivoImovel({
      imovel_id: id_imovel,
      tipo_documento_id: data.tipo_documento_id,
      nome_original: file!.originalname,
      nome_arquivo: salvo.nome_arquivo,
      caminho: salvo.caminho,
      tipo_mime: file!.mimetype,
      tamanho: file!.size,
      observacao: data.observacao,
      enviado_por_usuario_id: usuario.usuario_id,
      ativo: true,
    });

    await this.registrarAuditoria(
      usuario,
      "IMOVEL_ARQUIVO_CRIADO",
      "IMOVEL_ARQUIVO",
      arquivo.id_imovel_arquivo,
      arquivo.get({ plain: true }),
      ip,
    );

    return arquivo;
  }

  async prepararDownload(id: number, origem: ArquivoOrigem) {
    const { arquivo } = await this.buscarArquivo(id, origem);

    try {
      await stat(arquivo.caminho);
    } catch {
      throw new ServiceUnavailableException("Arquivo fisico nao encontrado.");
    }

    return {
      stream: createReadStream(arquivo.caminho),
      nome_original: arquivo.nome_original,
      tipo_mime: arquivo.tipo_mime,
    };
  }

  async removerArquivo(
    id: number,
    origem: ArquivoOrigem,
    usuario: AuthContext,
    ip?: string,
  ) {
    const { arquivo } = await this.buscarArquivo(id, origem);
    const anterior = arquivo.get({ plain: true });

    await arquivo.update({ ativo: false });
    await arquivo.destroy();

    await this.registrarAuditoria(
      usuario,
      `${origem}_ARQUIVO_REMOVIDO`,
      `${origem}_ARQUIVO`,
      id,
      anterior,
      ip,
    );
  }

  private async buscarArquivo(
    id: number,
    origem: ArquivoOrigem,
  ): Promise<ArquivoResolvido> {
    if (origem === "ENTIDADE") {
      const arquivo =
        await this.documentosRepository.buscarArquivoEntidadeAtivo(id);

      if (!arquivo) {
        throw new NotFoundException("Arquivo de entidade nao encontrado.");
      }

      return { origem, arquivo };
    }

    const arquivo = await this.documentosRepository.buscarArquivoImovelAtivo(id);

    if (!arquivo) {
      throw new NotFoundException("Arquivo de imovel nao encontrado.");
    }

    return { origem, arquivo };
  }

  private async validarUpload(data: UploadArquivoInput, file?: UploadedFile) {
    if (!file?.buffer) {
      throw new BadRequestException("Arquivo e obrigatorio.");
    }

    const tipoDocumento =
      await this.documentosRepository.buscarTipoDocumentoAtivo(
        data.tipo_documento_id,
      );

    if (!tipoDocumento) {
      throw new BadRequestException("Tipo de documento invalido.");
    }
  }

  private async validarEntidade(id_entidade: number) {
    const entidade =
      await this.documentosRepository.buscarEntidadePorId(id_entidade);

    if (!entidade) {
      throw new NotFoundException("Entidade nao encontrada.");
    }
  }

  private async validarImovel(id_imovel: number) {
    const imovel = await this.documentosRepository.buscarImovelPorId(id_imovel);

    if (!imovel) {
      throw new NotFoundException("Imovel nao encontrado.");
    }
  }

  private async gravarArquivo(
    grupo: "entidades" | "imoveis",
    id: number,
    file: UploadedFile,
  ) {
    const uploadRoot =
      process.env.UPLOAD_DIR ||
      path.resolve(process.cwd(), "uploads", "escritorio");
    const destino = path.join(uploadRoot, grupo, String(id));
    const extensao = path.extname(file.originalname);
    const nome_arquivo = `${Date.now()}-${randomUUID()}${extensao}`;
    const caminho = path.join(destino, nome_arquivo);

    await mkdir(destino, { recursive: true });
    await writeFile(caminho, file.buffer!);

    return { nome_arquivo, caminho };
  }

  private async garantirTiposPadrao() {
    const total = await this.documentosRepository.contarTiposDocumento();

    if (total > 0) {
      return;
    }

    await this.documentosRepository.criarTiposDocumento(tiposPadrao);
  }

  private registrarAuditoria(
    usuario: AuthContext,
    acao: string,
    recurso: string,
    recurso_id: number,
    valor_novo: object,
    ip?: string,
  ) {
    return this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao,
      recurso,
      recurso_id,
      valor_novo,
      ip,
    });
  }
}

