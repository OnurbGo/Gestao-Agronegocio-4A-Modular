import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import ExcelJS from "exceljs";
import { Op } from "sequelize";
import { AuditService } from "../audit/audit.service";
import { AuthContext } from "../auth-client/auth.types";
import { EntidadeTipo } from "../entidades/entidade-tipo.model";
import { Entidade } from "../entidades/entidade.model";
import { Ferias } from "./ferias.model";
import { FolhaMensal } from "./folha-mensal.model";
import { RegistroSalarial } from "./registro-salarial.model";
import {
  FeriasInput,
  FolhaMensalInput,
  ListarParticipantesQuery,
  RegistroSalarialInput,
} from "./folha.schema";

const meses = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const camposMoeda = [
  "salario_bruto",
  "inss",
  "irrf",
  "inss_adicional",
  "ferias",
  "comissao",
  "salario_liquido",
  "desconto_bar",
  "desconto_diverso_1",
  "desconto_diverso_2",
  "desconto_diverso_3",
  "salario_liquido_com_desconto",
];

@Injectable()
export class FolhaService {
  constructor(
    @InjectModel(Entidade) private readonly entidadeModel: typeof Entidade,
    @InjectModel(EntidadeTipo)
    private readonly entidadeTipoModel: typeof EntidadeTipo,
    @InjectModel(RegistroSalarial)
    private readonly registroSalarialModel: typeof RegistroSalarial,
    @InjectModel(Ferias) private readonly feriasModel: typeof Ferias,
    @InjectModel(FolhaMensal) private readonly folhaMensalModel: typeof FolhaMensal,
    private readonly auditService: AuditService,
  ) {}

  async listarParticipantes(query: ListarParticipantesQuery) {
    const where: Record<string, unknown> = { participa_folha: true, ativo: true };

    if (query.termo) {
      where[Op.or as unknown as string] = [
        { nome: { [Op.like]: `%${query.termo}%` } },
        { cpf_cnpj: { [Op.like]: `%${query.termo}%` } },
      ];
    }

    const entidades = await this.entidadeModel.findAll({
      where,
      include: [{ model: EntidadeTipo, as: "tipos", attributes: ["tipo"] }],
      order: [["nome", "ASC"]],
    });

    return Promise.all(
      entidades.map(async (entidade) => ({
        ...this.toEntidadeResponse(entidade),
        salario_atual: await this.buscarSalarioAtual(entidade.id_entidade),
      })),
    );
  }

  async buscarParticipante(id_entidade: number) {
    const entidade = await this.validarParticipante(id_entidade);
    const [registros_salariais, ferias] = await Promise.all([
      this.listarRegistrosSalariais(id_entidade),
      this.listarFerias(id_entidade),
    ]);

    return {
      ...this.toEntidadeResponse(entidade),
      salario_atual: await this.buscarSalarioAtual(id_entidade),
      registros_salariais,
      ferias,
    };
  }

  async listarRegistrosSalariais(id_entidade: number) {
    await this.validarParticipante(id_entidade);
    return this.registroSalarialModel.findAll({
      where: { entidade_id: id_entidade },
      order: [["inicio_vigencia", "DESC"]],
    });
  }

  async criarRegistroSalarial(
    id_entidade: number,
    data: RegistroSalarialInput,
    usuario: AuthContext,
    ip?: string,
  ) {
    await this.validarParticipante(id_entidade);
    const registro = await this.registroSalarialModel.create({
      entidade_id: id_entidade,
      inicio_vigencia: data.inicio_vigencia,
      salario: this.decimal(data.salario),
      percentual:
        data.percentual === null || data.percentual === undefined
          ? null
          : this.decimal(data.percentual),
      observacao: data.observacao || null,
    });

    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "REGISTRO_SALARIAL_CRIADO",
      recurso: "FOLHA",
      recurso_id: id_entidade,
      valor_novo: registro.get({ plain: true }),
      ip,
    });

    return registro;
  }

  async listarFerias(id_entidade: number) {
    await this.validarParticipante(id_entidade);
    return this.feriasModel.findAll({
      where: { entidade_id: id_entidade },
      order: [["periodo_aquisitivo_inicio", "DESC"]],
    });
  }

  async criarFerias(
    id_entidade: number,
    data: FeriasInput,
    usuario: AuthContext,
    ip?: string,
  ) {
    await this.validarParticipante(id_entidade);
    const ferias = await this.feriasModel.create({
      entidade_id: id_entidade,
      periodo_aquisitivo_inicio: data.periodo_aquisitivo_inicio,
      periodo_aquisitivo_fim: data.periodo_aquisitivo_fim,
      dias_totais: data.dias_totais,
      dias_gozados: data.dias_gozados,
      valor_abono:
        data.valor_abono === null || data.valor_abono === undefined
          ? null
          : this.decimal(data.valor_abono),
      periodo_inicio: data.periodo_inicio || null,
      periodo_fim: data.periodo_fim || null,
      data_retorno: data.data_retorno || null,
    });

    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "FERIAS_CRIADA",
      recurso: "FOLHA",
      recurso_id: id_entidade,
      valor_novo: ferias.get({ plain: true }),
      ip,
    });

    return ferias;
  }

  async listarLancamentosMensais(id_entidade: number, ano: number) {
    await this.validarParticipante(id_entidade);
    return this.folhaMensalModel.findAll({
      where: { entidade_id: id_entidade, ano },
      order: [["mes", "ASC"]],
    });
  }

  async salvarLancamentosMensais(
    id_entidade: number,
    data: FolhaMensalInput,
    usuario: AuthContext,
    ip?: string,
  ) {
    await this.validarParticipante(id_entidade);
    const transaction = await this.folhaMensalModel.sequelize!.transaction();

    try {
      for (const linha of data.linhas) {
        const valores = this.calcularLinha(linha);
        const existente = await this.folhaMensalModel.findOne({
          where: { entidade_id: id_entidade, ano: data.ano, mes: linha.mes },
          transaction,
        });

        if (existente) {
          await existente.update(valores, { transaction });
        } else {
          await this.folhaMensalModel.create(
            { entidade_id: id_entidade, ano: data.ano, ...valores },
            { transaction },
          );
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    const lancamentos = await this.listarLancamentosMensais(id_entidade, data.ano);
    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "FOLHA_MENSAL_SALVA",
      recurso: "FOLHA",
      recurso_id: id_entidade,
      valor_novo: { ano: data.ano, lancamentos },
      ip,
    });

    return lancamentos;
  }

  async relatorioMensal(ano: number, mes: number) {
    const lancamentos = await this.folhaMensalModel.findAll({
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

    const itens = lancamentos.map((item) => item.get({ plain: true }));
    return {
      ano,
      mes,
      nome_mes: meses[mes - 1],
      total: this.decimal(
        itens.reduce(
          (soma, item) => soma + this.numero(item.salario_liquido_com_desconto),
          0,
        ),
      ),
      itens,
    };
  }

  async gerarPlanilhaParticipante(id_entidade: number, ano: number) {
    const participante = await this.buscarParticipante(id_entidade);
    const lancamentos = await this.listarLancamentosMensais(id_entidade, ano);
    const nome = String(participante["nome"] || "participante");
    const workbook = this.criarWorkbook();
    const sheet = workbook.addWorksheet("Folha anual");

    sheet.addRow(["Folha de Pagamento"]);
    sheet.addRow(["Participante", nome]);
    sheet.addRow(["Ano", ano]);
    sheet.addRow([]);
    this.configurarColunas(sheet);
    lancamentos.forEach((item) => {
      sheet.addRow(this.linhaPlanilha(item.get({ plain: true })));
    });
    this.adicionarTotal(sheet, lancamentos.map((item) => item.get({ plain: true })));

    return {
      buffer: await this.getWorkbookBuffer(workbook),
      filename: `folha-${this.slug(nome)}-${ano}.xlsx`,
    };
  }

  async gerarPlanilhaRelatorioMensal(ano: number, mes: number) {
    const relatorio = await this.relatorioMensal(ano, mes);
    const workbook = this.criarWorkbook();
    const sheet = workbook.addWorksheet("Relatorio mensal");

    sheet.addRow(["Relatorio mensal da folha"]);
    sheet.addRow(["Mes", relatorio.nome_mes]);
    sheet.addRow(["Ano", ano]);
    sheet.addRow([]);
    this.configurarColunas(sheet, true);
    relatorio.itens.forEach((item) => sheet.addRow(this.linhaPlanilha(item, true)));
    this.adicionarTotal(sheet, relatorio.itens);

    return {
      buffer: await this.getWorkbookBuffer(workbook),
      filename: `relatorio-folha-${ano}-${String(mes).padStart(2, "0")}.xlsx`,
    };
  }

  private async validarParticipante(id_entidade: number) {
    const entidade = await this.entidadeModel.findOne({
      where: { id_entidade, participa_folha: true, ativo: true },
      include: [{ model: EntidadeTipo, as: "tipos", attributes: ["tipo"] }],
    });

    if (!entidade) {
      throw new BadRequestException("Entidade nao configurada para folha.");
    }

    return entidade;
  }

  private async buscarSalarioAtual(id_entidade: number) {
    const registro = await this.registroSalarialModel.findOne({
      where: { entidade_id: id_entidade },
      order: [["inicio_vigencia", "DESC"]],
    });
    return registro?.salario || null;
  }

  private calcularLinha(linha: FolhaMensalInput["linhas"][number]) {
    const salario_liquido =
      this.numero(linha.salario_bruto) +
      this.numero(linha.ferias) +
      this.numero(linha.comissao) -
      this.numero(linha.inss) -
      this.numero(linha.irrf) -
      this.numero(linha.inss_adicional);

    const descontos =
      this.numero(linha.desconto_bar) +
      this.numero(linha.desconto_diverso_1) +
      this.numero(linha.desconto_diverso_2) +
      this.numero(linha.desconto_diverso_3);

    return {
      mes: linha.mes,
      dias_trabalhados: linha.dias_trabalhados,
      salario_bruto: this.decimal(linha.salario_bruto),
      inss: this.decimal(linha.inss),
      irrf: this.decimal(linha.irrf),
      inss_adicional: this.decimal(linha.inss_adicional),
      ferias: this.decimal(linha.ferias),
      comissao: this.decimal(linha.comissao),
      salario_liquido: this.decimal(salario_liquido),
      desconto_bar: this.decimal(linha.desconto_bar),
      desconto_diverso_1: this.decimal(linha.desconto_diverso_1),
      desconto_diverso_2: this.decimal(linha.desconto_diverso_2),
      desconto_diverso_3: this.decimal(linha.desconto_diverso_3),
      salario_liquido_com_desconto: this.decimal(salario_liquido - descontos),
    };
  }

  private configurarColunas(sheet: ExcelJS.Worksheet, incluirParticipante = false) {
    const columns = [
      ...(incluirParticipante
        ? [{ header: "Participante", key: "participante", width: 30 }]
        : []),
      { header: "Mes", key: "mes", width: 14 },
      { header: "Dias trabalhados", key: "dias_trabalhados", width: 18 },
      { header: "Salario bruto", key: "salario_bruto", width: 16 },
      { header: "INSS", key: "inss", width: 14 },
      { header: "IRRF", key: "irrf", width: 14 },
      { header: "INSS adicional", key: "inss_adicional", width: 16 },
      { header: "Ferias", key: "ferias", width: 14 },
      { header: "Comissao", key: "comissao", width: 14 },
      { header: "Salario liquido", key: "salario_liquido", width: 17 },
      { header: "Desconto bar", key: "desconto_bar", width: 15 },
      { header: "Desconto diverso 1", key: "desconto_diverso_1", width: 18 },
      { header: "Desconto diverso 2", key: "desconto_diverso_2", width: 18 },
      { header: "Desconto diverso 3", key: "desconto_diverso_3", width: 18 },
      {
        header: "Liquido com desconto",
        key: "salario_liquido_com_desconto",
        width: 20,
      },
    ];

    sheet.addRow(columns.map((column) => column.header));
    columns.forEach((column, index) => {
      const sheetColumn = sheet.getColumn(index + 1);
      sheetColumn.key = column.key;
      sheetColumn.width = column.width;
    });
    sheet.lastRow!.font = { bold: true };
  }

  private linhaPlanilha(lancamento: Record<string, unknown>, incluirParticipante = false) {
    const row: Record<string, unknown> = {
      ...(incluirParticipante
        ? { participante: (lancamento.entidade as { nome?: string })?.nome }
        : {}),
      mes: meses[Number(lancamento.mes) - 1],
      dias_trabalhados: lancamento.dias_trabalhados,
    };

    camposMoeda.forEach((campo) => {
      row[campo] = this.numero(lancamento[campo]);
    });

    return row;
  }

  private adicionarTotal(sheet: ExcelJS.Worksheet, lancamentos: Record<string, unknown>[]) {
    const total = lancamentos.reduce(
      (soma, item) => soma + this.numero(item.salario_liquido_com_desconto),
      0,
    );
    const row = sheet.addRow([]);
    row.getCell(1).value = "Total liquido com desconto";
    row.getCell(sheet.columnCount).value = total;
    row.font = { bold: true };
  }

  private criarWorkbook() {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Gestao Agronegocio 4A";
    workbook.created = new Date();
    return workbook;
  }

  private async getWorkbookBuffer(workbook: ExcelJS.Workbook) {
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  }

  private toEntidadeResponse(entidade: Entidade) {
    const plain = entidade.get({ plain: true }) as Record<string, unknown> & {
      tipos?: Array<{ tipo: string }>;
    };
    return { ...plain, tipos: plain.tipos?.map((item) => item.tipo) || [] };
  }

  private numero(value: unknown) {
    if (value === null || value === undefined || value === "") return 0;
    const parsed = Number(String(value).replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private decimal(value: unknown) {
    return this.numero(value).toFixed(2);
  }

  private slug(value: string) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
  }
}
