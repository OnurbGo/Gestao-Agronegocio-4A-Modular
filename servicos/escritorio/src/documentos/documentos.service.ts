import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { createReadStream } from "fs";
import { mkdir, stat, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { AuditService } from "../audit/audit.service";
import { AuthContext } from "../auth-client/auth.types";
import { EntidadeArquivo } from "../entidades/entidade-arquivo.model";
import { Entidade } from "../entidades/entidade.model";
import { TipoDocumento } from "../entidades/tipo-documento.model";
import { ImovelArquivo } from "../imoveis/imovel-arquivo.model";
import { Imovel } from "../imoveis/imovel.model";
import { ArquivoOrigem, UploadArquivoInput } from "./documentos.schema";

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
    @InjectModel(Entidade) private readonly entidadeModel: typeof Entidade,
    @InjectModel(Imovel) private readonly imovelModel: typeof Imovel,
    @InjectModel(TipoDocumento)
    private readonly tipoDocumentoModel: typeof TipoDocumento,
    @InjectModel(EntidadeArquivo)
    private readonly entidadeArquivoModel: typeof EntidadeArquivo,
    @InjectModel(ImovelArquivo)
    private readonly imovelArquivoModel: typeof ImovelArquivo,
    private readonly auditService: AuditService,
  ) {}

  async listarTiposDocumento() {
    await this.garantirTiposPadrao();

    return this.tipoDocumentoModel.findAll({
      where: { ativo: true },
      order: [["nome", "ASC"]],
    });
  }

  async listarArquivosEntidade(id_entidade: number) {
    await this.validarEntidade(id_entidade);

    return this.entidadeArquivoModel.findAll({
      where: { entidade_id: id_entidade, ativo: true },
      include: [{ model: TipoDocumento, as: "tipoDocumento" }],
      order: [["createdAt", "DESC"]],
    });
  }

  async listarArquivosImovel(id_imovel: number) {
    await this.validarImovel(id_imovel);

    return this.imovelArquivoModel.findAll({
      where: { imovel_id: id_imovel, ativo: true },
      include: [{ model: TipoDocumento, as: "tipoDocumento" }],
      order: [["createdAt", "DESC"]],
    });
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

    const arquivo = await this.entidadeArquivoModel.create({
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

    const arquivo = await this.imovelArquivoModel.create({
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
      const arquivo = await this.entidadeArquivoModel.findOne({
        where: { id_entidade_arquivo: id, ativo: true },
      });

      if (!arquivo) {
        throw new NotFoundException("Arquivo de entidade nao encontrado.");
      }

      return { origem, arquivo };
    }

    const arquivo = await this.imovelArquivoModel.findOne({
      where: { id_imovel_arquivo: id, ativo: true },
    });

    if (!arquivo) {
      throw new NotFoundException("Arquivo de imovel nao encontrado.");
    }

    return { origem, arquivo };
  }

  private async validarUpload(data: UploadArquivoInput, file?: UploadedFile) {
    if (!file?.buffer) {
      throw new BadRequestException("Arquivo e obrigatorio.");
    }

    const tipoDocumento = await this.tipoDocumentoModel.findOne({
      where: { id_tipo_documento: data.tipo_documento_id, ativo: true },
    });

    if (!tipoDocumento) {
      throw new BadRequestException("Tipo de documento invalido.");
    }
  }

  private async validarEntidade(id_entidade: number) {
    const entidade = await this.entidadeModel.findByPk(id_entidade);

    if (!entidade) {
      throw new NotFoundException("Entidade nao encontrada.");
    }
  }

  private async validarImovel(id_imovel: number) {
    const imovel = await this.imovelModel.findByPk(id_imovel);

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
    const total = await this.tipoDocumentoModel.count();

    if (total > 0) {
      return;
    }

    await this.tipoDocumentoModel.bulkCreate(tiposPadrao);
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
