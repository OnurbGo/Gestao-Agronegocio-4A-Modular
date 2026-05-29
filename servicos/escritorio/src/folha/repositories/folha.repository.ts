import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { FindAndCountOptions, FindOptions, Transaction } from "sequelize";
import { Entidade } from "../../entidades/entities/entidade.entity";
import { EntidadeTipo } from "../../entidades/entities/entidade-tipo.entity";
import { Ferias } from "../entities/ferias.entity";
import { FolhaMensal } from "../entities/folha-mensal.entity";
import { RegistroSalarial } from "../entities/registro-salarial.entity";

@Injectable()
export class FolhaRepository {
  constructor(
    @InjectModel(Entidade) private readonly entidadeModel: typeof Entidade,
    @InjectModel(EntidadeTipo)
    private readonly entidadeTipoModel: typeof EntidadeTipo,
    @InjectModel(RegistroSalarial)
    private readonly registroSalarialModel: typeof RegistroSalarial,
    @InjectModel(Ferias) private readonly feriasModel: typeof Ferias,
    @InjectModel(FolhaMensal)
    private readonly folhaMensalModel: typeof FolhaMensal,
  ) {}

  listarParticipantes(options: FindAndCountOptions) {
    return this.entidadeModel.findAndCountAll(options);
  }

  buscarParticipante(id_entidade: number) {
    return this.entidadeModel.findOne({
      where: { id_entidade, participa_folha: true, ativo: true },
      include: [{ model: EntidadeTipo, as: "tipos", attributes: ["tipo"] }],
    });
  }

  listarRegistrosSalariais(options: FindAndCountOptions) {
    return this.registroSalarialModel.findAndCountAll(options);
  }

  criarRegistroSalarial(data: Record<string, unknown>) {
    return this.registroSalarialModel.create(data);
  }

  buscarRegistroSalarial(options: FindOptions) {
    return this.registroSalarialModel.findOne(options);
  }

  listarFerias(options: FindAndCountOptions) {
    return this.feriasModel.findAndCountAll(options);
  }

  somarDiasGozadosFerias(where: Record<string, unknown>) {
    return this.feriasModel.sum("dias_gozados", { where });
  }

  criarFerias(data: Record<string, unknown>) {
    return this.feriasModel.create(data);
  }

  listarLancamentosMensais(where: Record<string, unknown>) {
    return this.folhaMensalModel.findAll({
      where,
      order: [["mes", "ASC"]],
    });
  }

  criarTransacao() {
    return this.folhaMensalModel.sequelize!.transaction();
  }

  buscarLancamentoMensal(
    where: Record<string, unknown>,
    transaction?: Transaction,
  ) {
    return this.folhaMensalModel.findOne({ where, transaction });
  }

  criarLancamentoMensal(data: Record<string, unknown>, transaction?: Transaction) {
    return this.folhaMensalModel.create(data, { transaction });
  }

  listarRelatorioMensal(ano: number, mes: number) {
    return this.folhaMensalModel.findAll({
      where: { ano, mes },
      include: [
        {
          model: Entidade,
          as: "entidade",
          where: { participa_folha: true, ativo: true },
        },
      ],
      order: [[{ model: Entidade, as: "entidade" }, "nome", "ASC"]],
    });
  }
}
