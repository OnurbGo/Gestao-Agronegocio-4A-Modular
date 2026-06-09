import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { EntidadeArquivo } from "../../entidades/entities/entidade-arquivo.entity";
import { Entidade } from "../../entidades/entities/entidade.entity";
import { TipoDocumento } from "../../entidades/entities/tipo-documento.entity";
import { ImovelArquivo } from "../../imoveis/entities/imovel-arquivo.entity";
import { Imovel } from "../../imoveis/entities/imovel.entity";

@Injectable()
export class DocumentosRepository {
  constructor(
    @InjectModel(Entidade) private readonly entidadeModel: typeof Entidade,
    @InjectModel(Imovel) private readonly imovelModel: typeof Imovel,
    @InjectModel(TipoDocumento)
    private readonly tipoDocumentoModel: typeof TipoDocumento,
    @InjectModel(EntidadeArquivo)
    private readonly entidadeArquivoModel: typeof EntidadeArquivo,
    @InjectModel(ImovelArquivo)
    private readonly imovelArquivoModel: typeof ImovelArquivo,
  ) {}

  listarTiposDocumentoAtivos() {
    return this.tipoDocumentoModel.findAll({
      where: { ativo: true },
      order: [["nome", "ASC"]],
    });
  }

  contarTiposDocumento() {
    return this.tipoDocumentoModel.count();
  }

  criarTiposDocumento(data: Array<Record<string, unknown>>) {
    return this.tipoDocumentoModel.bulkCreate(data);
  }

  listarArquivosEntidade(id_entidade: number) {
    return this.entidadeArquivoModel.findAll({
      where: { entidade_id: id_entidade, ativo: true },
      include: [{ model: TipoDocumento, as: "tipoDocumento" }],
      order: [["createdAt", "DESC"]],
    });
  }

  listarArquivosImovel(id_imovel: number) {
    return this.imovelArquivoModel.findAll({
      where: { imovel_id: id_imovel, ativo: true },
      include: [{ model: TipoDocumento, as: "tipoDocumento" }],
      order: [["createdAt", "DESC"]],
    });
  }

  criarArquivoEntidade(data: Record<string, unknown>) {
    return this.entidadeArquivoModel.create(data);
  }

  criarArquivoImovel(data: Record<string, unknown>) {
    return this.imovelArquivoModel.create(data);
  }

  buscarArquivoEntidadeAtivo(id_entidade_arquivo: number) {
    return this.entidadeArquivoModel.findOne({
      where: { id_entidade_arquivo, ativo: true },
    });
  }

  buscarArquivoImovelAtivo(id_imovel_arquivo: number) {
    return this.imovelArquivoModel.findOne({
      where: { id_imovel_arquivo, ativo: true },
    });
  }

  buscarTipoDocumentoAtivo(id_tipo_documento: number) {
    return this.tipoDocumentoModel.findOne({
      where: { id_tipo_documento, ativo: true },
    });
  }

  buscarEntidadePorId(id_entidade: number) {
    return this.entidadeModel.findByPk(id_entidade);
  }

  buscarImovelPorId(id_imovel: number) {
    return this.imovelModel.findByPk(id_imovel);
  }
}

