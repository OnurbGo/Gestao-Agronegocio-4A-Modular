import { BadRequestException, Injectable } from "@nestjs/common";
import { Op, Transaction } from "sequelize";
import { AuditService } from "../../auditoria/services/audit.service";
import { AuthContext } from "../../auth-client/types/auth.types";
import { EntidadeTipo } from "../../entidades/entities/entidade-tipo.entity";
import { Entidade } from "../../entidades/entities/entidade.entity";
import {
  getPagination,
  toPaginatedResponse,
} from "../../shared/utils/pagination";
import {
  FeriasInput,
  FolhaMensalInput,
  ListarFeriasQuery,
  ListarParticipantesQuery,
  ListarRegistrosSalariaisQuery,
  PercentualSugeridoQuery,
  RegistroSalarialInput,
} from "../dto/folha.dto";
import { Ferias } from "../entities/ferias.entity";
import { FolhaMensal } from "../entities/folha-mensal.entity";
import { RegistroSalarial } from "../entities/registro-salarial.entity";
import { FolhaRepository } from "../repositories/folha.repository";
import {
  calcularLinha,
  calcularSalarioProporcionalDiasMes,
  calcularValorPeriodoComSalarios,
  buscarSalarioMensalVigenteMes,
  diasComSalarioParaTrabalhoMensal,
  formatarMesAno,
  impactaPeriodos,
  linhaBaseLancamento,
  periodoRegistroSalarial,
  temSalarioCompletoPeriodo,
  type LinhaCalculada,
  type LinhaFolha,
  type RegistroSalarialLike,
} from "../utils/folha-calculo.utils";
import {
  addDays,
  dateOnlyValue,
  diasInclusivos,
  dividirPeriodoPorMes,
  formatDateOnly,
  hojeDateOnly,
  monthEndDateOnly,
  monthStartDateOnly,
  parseDateOnly,
  type SegmentoMensal,
  validarData,
  validarOrdemDatas,
} from "../utils/folha-date.utils";
import {
  adicionarTotal,
  configurarColunas,
  criarWorkbook,
  getWorkbookBuffer,
  linhaPlanilha,
  meses,
  slug,
} from "../utils/folha-excel.utils";
import { decimal, numero } from "../utils/folha-number.utils";

type ImpactoSalarial = {
  ferias: Record<string, unknown>[];
  lancamentos: Record<string, unknown>[];
  sem_salario: Record<string, unknown>[];
  tem_impacto: boolean;
};

@Injectable()
export class FolhaService {
  constructor(
    private readonly folhaRepository: FolhaRepository,
    private readonly auditService: AuditService,
  ) {}

  async listarParticipantes(query: ListarParticipantesQuery) {
    const where: Record<string, unknown> = { participa_folha: true, ativo: true };
    const termo = query.search || query.termo;
    const { page, limit, offset } = getPagination(query);

    if (termo) {
      where[Op.or as unknown as string] = [
        { nome: { [Op.like]: `%${termo}%` } },
        { cpf_cnpj: { [Op.like]: `%${termo}%` } },
      ];
    }

    const { rows, count } = await this.folhaRepository.listarParticipantes({
      where,
      include: [{ model: EntidadeTipo, as: "tipos", attributes: ["tipo"] }],
      distinct: true,
      limit,
      offset,
      order: [["nome", "ASC"]],
    });

    const items = await Promise.all(
      rows.map(async (entidade) => ({
        ...this.toEntidadeResponse(entidade),
        salario_atual: await this.buscarSalarioAtual(entidade.id_entidade),
      })),
    );

    return toPaginatedResponse(items, count, page, limit);
  }

  async buscarParticipante(id_entidade: number) {
    const entidade = await this.validarParticipante(id_entidade);
    const [registros_salariais, ferias] = await Promise.all([
      this.listarRegistrosSalariais(id_entidade, { page: 1, limit: 5 }),
      this.listarFerias(id_entidade, { page: 1, limit: 5 }),
    ]);

    return {
      ...this.toEntidadeResponse(entidade),
      salario_atual: await this.buscarSalarioAtual(id_entidade),
      registros_salariais: registros_salariais.items,
      ferias: ferias.items,
    };
  }

  async listarRegistrosSalariais(
    id_entidade: number,
    query: ListarRegistrosSalariaisQuery,
  ) {
    await this.validarParticipante(id_entidade);
    const { page, limit, offset } = getPagination(query);
    const { rows, count } = await this.folhaRepository.listarRegistrosSalariais({
      where: { entidade_id: id_entidade },
      limit,
      offset,
      order: [["inicio_vigencia", "DESC"]],
    });

    return toPaginatedResponse(rows, count, page, limit);
  }

  async percentualSugerido(
    id_entidade: number,
    query: PercentualSugeridoQuery,
  ) {
    await this.validarParticipante(id_entidade);
    const salarioNovo = numero(query.salario);
    const base = await this.buscarSalarioBaseAnterior(
      id_entidade,
      query.inicio_vigencia,
    );
    const salarioBase = numero(base?.salario);
    const percentual =
      base && salarioBase > 0
        ? ((salarioNovo - salarioBase) / salarioBase) * 100
        : null;

    return {
      inicio_vigencia: query.inicio_vigencia,
      salario: decimal(salarioNovo),
      salario_base: base?.salario || null,
      inicio_vigencia_base: base?.inicio_vigencia || null,
      percentual_sugerido:
        percentual === null ? null : Number(percentual.toFixed(2)),
    };
  }

  async impactoEdicaoRegistroSalarial(
    id_entidade: number,
    id_registro_salarial: number,
    data: RegistroSalarialInput,
  ) {
    await this.validarParticipante(id_entidade);
    const registro = await this.buscarRegistroSalarialDaEntidade(
      id_entidade,
      id_registro_salarial,
    );
    const inicio = validarData(data.inicio_vigencia, "Inicio da vigencia");
    const fim = data.fim_vigencia
      ? validarData(data.fim_vigencia, "Fim da vigencia")
      : null;
    validarOrdemDatas(inicio, fim, "Fim da vigencia");

    await this.validarConflitoRegistroSalarial(
      id_entidade,
      inicio,
      fim,
      undefined,
      id_registro_salarial,
    );

    const anterior = registro.get({ plain: true }) as Record<string, unknown>;
    const registrosDepois = await this.registrosSalariaisSimulados(
      id_entidade,
      id_registro_salarial,
      {
        ...anterior,
        inicio_vigencia: inicio,
        fim_vigencia: fim,
        salario: decimal(data.salario),
      },
    );

    return this.montarImpactoSalarial(
      id_entidade,
      [
        periodoRegistroSalarial(anterior),
        { inicio, fim },
      ],
      registrosDepois,
    );
  }

  async impactoExclusaoRegistroSalarial(
    id_entidade: number,
    id_registro_salarial: number,
  ) {
    await this.validarParticipante(id_entidade);
    const registro = await this.buscarRegistroSalarialDaEntidade(
      id_entidade,
      id_registro_salarial,
    );
    const anterior = registro.get({ plain: true }) as Record<string, unknown>;
    const registrosDepois = await this.registrosSalariaisSimulados(
      id_entidade,
      id_registro_salarial,
      null,
    );

    return this.montarImpactoSalarial(
      id_entidade,
      [periodoRegistroSalarial(anterior)],
      registrosDepois,
    );
  }

  async criarRegistroSalarial(
    id_entidade: number,
    data: RegistroSalarialInput,
    usuario: AuthContext,
    ip?: string,
  ) {
    await this.validarParticipante(id_entidade);
    const inicio = validarData(data.inicio_vigencia, "Inicio da vigencia");
    const fim = data.fim_vigencia
      ? validarData(data.fim_vigencia, "Fim da vigencia")
      : null;
    validarOrdemDatas(inicio, fim, "Fim da vigencia");

    const transaction = await this.folhaRepository.criarTransacao();
    let registro: RegistroSalarial;

    try {
      await this.validarConflitoRegistroSalarial(
        id_entidade,
        inicio,
        fim,
        transaction,
      );

      registro = await this.folhaRepository.criarRegistroSalarial(
        {
          entidade_id: id_entidade,
          inicio_vigencia: inicio,
          fim_vigencia: fim,
          salario: decimal(data.salario),
          percentual:
            data.percentual === null || data.percentual === undefined
              ? null
              : decimal(data.percentual),
          observacao: data.observacao || null,
        },
        transaction,
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    const valorNovo = registro!.get({ plain: true });

    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "REGISTRO_SALARIAL_CRIADO",
      recurso: "FOLHA",
      recurso_id: id_entidade,
      valor_novo: valorNovo,
      ip,
    });

    return valorNovo;
  }

  async atualizarRegistroSalarial(
    id_entidade: number,
    id_registro_salarial: number,
    data: RegistroSalarialInput,
    usuario: AuthContext,
    ip?: string,
  ) {
    await this.validarParticipante(id_entidade);
    const inicio = validarData(data.inicio_vigencia, "Inicio da vigencia");
    const fim = data.fim_vigencia
      ? validarData(data.fim_vigencia, "Fim da vigencia")
      : null;
    validarOrdemDatas(inicio, fim, "Fim da vigencia");

    const transaction = await this.folhaRepository.criarTransacao();
    let valorAnterior: Record<string, unknown> | null = null;
    let valorNovo: Record<string, unknown> | null = null;

    try {
      const registro = await this.buscarRegistroSalarialDaEntidade(
        id_entidade,
        id_registro_salarial,
        transaction,
      );
      valorAnterior = registro.get({ plain: true }) as Record<string, unknown>;

      await this.validarConflitoRegistroSalarial(
        id_entidade,
        inicio,
        fim,
        transaction,
        id_registro_salarial,
      );

      await registro.update(
        {
          inicio_vigencia: inicio,
          fim_vigencia: fim,
          salario: decimal(data.salario),
          percentual:
            data.percentual === null || data.percentual === undefined
              ? null
              : decimal(data.percentual),
          observacao: data.observacao || null,
        },
        { transaction },
      );

      const feriasRecalculadas = await this.recalcularFeriasRegistradas(
        id_entidade,
        transaction,
      );
      const lancamentosImpactados = await this.recalcularLancamentosSalvos(
        id_entidade,
        transaction,
      );

      valorNovo = {
        ...(registro.get({ plain: true }) as Record<string, unknown>),
        ferias_recalculadas: feriasRecalculadas,
        lancamentos_impactados: lancamentosImpactados,
      };

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "REGISTRO_SALARIAL_ATUALIZADO",
      recurso: "FOLHA",
      recurso_id: id_entidade,
      valor_anterior: valorAnterior,
      valor_novo: valorNovo,
      ip,
    });

    return valorNovo;
  }

  async removerRegistroSalarial(
    id_entidade: number,
    id_registro_salarial: number,
    usuario: AuthContext,
    ip?: string,
  ) {
    await this.validarParticipante(id_entidade);
    const transaction = await this.folhaRepository.criarTransacao();
    let valorAnterior: Record<string, unknown> | null = null;
    let valorNovo: Record<string, unknown> | null = null;

    try {
      const registro = await this.buscarRegistroSalarialDaEntidade(
        id_entidade,
        id_registro_salarial,
        transaction,
      );
      valorAnterior = registro.get({ plain: true }) as Record<string, unknown>;

      await registro.destroy({ transaction });

      const feriasRecalculadas = await this.recalcularFeriasRegistradas(
        id_entidade,
        transaction,
      );
      const lancamentosImpactados = await this.recalcularLancamentosSalvos(
        id_entidade,
        transaction,
      );

      valorNovo = {
        id_registro_salarial,
        removido: true,
        ferias_recalculadas: feriasRecalculadas,
        lancamentos_impactados: lancamentosImpactados,
      };

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "REGISTRO_SALARIAL_REMOVIDO",
      recurso: "FOLHA",
      recurso_id: id_entidade,
      valor_anterior: valorAnterior,
      valor_novo: valorNovo,
      ip,
    });

    return valorNovo;
  }

  async listarFerias(id_entidade: number, query: ListarFeriasQuery) {
    const entidade = await this.validarParticipante(id_entidade);
    const { page, limit, offset } = getPagination(query);
    const where = { entidade_id: id_entidade };
    const { rows, count } = await this.folhaRepository.listarFerias({
      where,
      limit,
      offset,
      order: [["inicio_gozado", "DESC"]],
    });
    const totalDiasGozados =
      await this.folhaRepository.somarDiasGozadosFerias(where);
    const summary = await this.calcularResumoFerias(
      entidade,
      id_entidade,
      Number(totalDiasGozados || 0),
    );

    return {
      ...toPaginatedResponse(
        rows.map((item) => this.toFeriasResponse(item)),
        count,
        page,
        limit,
      ),
      summary,
    };
  }

  async criarFerias(
    id_entidade: number,
    data: FeriasInput,
    usuario: AuthContext,
    ip?: string,
  ) {
    await this.validarParticipante(id_entidade);
    const inicio = validarData(data.inicio_gozado, "Inicio gozado");
    const fim = validarData(data.fim_gozado, "Fim gozado");
    validarOrdemDatas(inicio, fim, "Fim gozado");
    const valorAbono = decimal(data.valor_abono);

    const calculo = await this.calcularFerias(id_entidade, inicio, fim);
    const transaction = await this.folhaRepository.criarTransacao();
    let ferias: Ferias;
    let lancamentosImpactados: Record<string, unknown>[] = [];

    try {
      ferias = await this.folhaRepository.criarFerias(
        {
          entidade_id: id_entidade,
          inicio_gozado: inicio,
          fim_gozado: fim,
          dias_gozados: calculo.dias_gozados,
          valor_ferias: decimal(calculo.valor_ferias),
          valor_abono: valorAbono,
        },
        transaction,
      );

      lancamentosImpactados = await this.recalcularFeriasAutomaticasPeriodo(
        id_entidade,
        inicio,
        fim,
        transaction,
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    const valorNovo = {
      ...ferias!.get({ plain: true }),
      lancamentos_impactados: lancamentosImpactados,
    };

    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "FERIAS_CRIADA",
      recurso: "FOLHA",
      recurso_id: id_entidade,
      valor_novo: valorNovo,
      ip,
    });

    return valorNovo;
  }

  async atualizarFerias(
    id_entidade: number,
    id_ferias: number,
    data: FeriasInput,
    usuario: AuthContext,
    ip?: string,
  ) {
    await this.validarParticipante(id_entidade);
    const inicio = validarData(data.inicio_gozado, "Inicio gozado");
    const fim = validarData(data.fim_gozado, "Fim gozado");
    validarOrdemDatas(inicio, fim, "Fim gozado");
    const valorAbono = decimal(data.valor_abono);

    const calculo = await this.calcularFerias(id_entidade, inicio, fim);
    const transaction = await this.folhaRepository.criarTransacao();
    let valorAnterior: Record<string, unknown> | null = null;
    let valorNovo: Record<string, unknown> | null = null;

    try {
      const ferias = await this.buscarFeriasDaEntidade(
        id_entidade,
        id_ferias,
        transaction,
      );
      valorAnterior = this.toFeriasResponse(ferias);

      await ferias.update(
        {
          inicio_gozado: inicio,
          fim_gozado: fim,
          dias_gozados: calculo.dias_gozados,
          valor_ferias: decimal(calculo.valor_ferias),
          valor_abono: valorAbono,
        },
        { transaction },
      );

      const lancamentosImpactados =
        await this.recalcularFeriasAutomaticasPeriodos(
          id_entidade,
          [
            {
              inicio: dateOnlyValue(valorAnterior.inicio_gozado),
              fim: dateOnlyValue(valorAnterior.fim_gozado),
            },
            { inicio, fim },
          ],
          transaction,
        );

      valorNovo = {
        ...this.toFeriasResponse(ferias),
        lancamentos_impactados: lancamentosImpactados,
      };

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "FERIAS_ATUALIZADA",
      recurso: "FOLHA",
      recurso_id: id_entidade,
      valor_anterior: valorAnterior,
      valor_novo: valorNovo,
      ip,
    });

    return valorNovo;
  }

  async removerFerias(
    id_entidade: number,
    id_ferias: number,
    usuario: AuthContext,
    ip?: string,
  ) {
    await this.validarParticipante(id_entidade);
    const transaction = await this.folhaRepository.criarTransacao();
    let valorAnterior: Record<string, unknown> | null = null;
    let valorNovo: Record<string, unknown> | null = null;

    try {
      const ferias = await this.buscarFeriasDaEntidade(
        id_entidade,
        id_ferias,
        transaction,
      );
      valorAnterior = this.toFeriasResponse(ferias);

      await ferias.destroy({ transaction });

      const lancamentosImpactados = await this.recalcularFeriasAutomaticasPeriodo(
        id_entidade,
        dateOnlyValue(valorAnterior.inicio_gozado),
        dateOnlyValue(valorAnterior.fim_gozado),
        transaction,
      );

      valorNovo = {
        id_ferias,
        removido: true,
        lancamentos_impactados: lancamentosImpactados,
      };

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "FERIAS_REMOVIDA",
      recurso: "FOLHA",
      recurso_id: id_entidade,
      valor_anterior: valorAnterior,
      valor_novo: valorNovo,
      ip,
    });

    return valorNovo;
  }

  async listarLancamentosMensais(id_entidade: number, ano: number) {
    await this.validarParticipante(id_entidade);
    const lancamentos = await this.folhaRepository.listarLancamentosMensais({
      entidade_id: id_entidade,
      ano,
    });
    return this.montarLancamentosAno(id_entidade, ano, lancamentos);
  }

  async salvarLancamentosMensais(
    id_entidade: number,
    data: FolhaMensalInput,
    usuario: AuthContext,
    ip?: string,
  ) {
    await this.validarParticipante(id_entidade);
    const transaction = await this.folhaRepository.criarTransacao();

    try {
      for (const linha of data.linhas) {
        const valores = await this.prepararLancamentoMensal(
          id_entidade,
          data.ano,
          linha.mes,
          linha,
          transaction,
        );
        await this.salvarLancamento(id_entidade, data.ano, valores, transaction);
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
    const lancamentos = await this.folhaRepository.listarRelatorioMensal(ano, mes);

    const itens = await Promise.all(
      lancamentos.map(async (item) => {
        const plain = item.get({ plain: true }) as Record<string, unknown>;
        return {
          ...plain,
          ...(await this.enriquecerLancamentoMensal(
            Number(plain.entidade_id),
            ano,
            mes,
            item,
          )),
          entidade: plain.entidade,
        };
      }),
    );
    return {
      ano,
      mes,
      nome_mes: meses[mes - 1],
      total: decimal(
        itens.reduce(
          (soma, item) => soma + numero(item.salario_final_com_ferias),
          0,
        ),
      ),
      total_sem_ferias: decimal(
        itens.reduce(
          (soma, item) => soma + numero(item.salario_liquido_com_desconto),
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
    const workbook = criarWorkbook();
    const sheet = workbook.addWorksheet("Folha anual");

    sheet.addRow(["Folha de Pagamento"]);
    sheet.addRow(["Participante", nome]);
    sheet.addRow(["Ano", ano]);
    sheet.addRow([]);
    configurarColunas(sheet);
    lancamentos.forEach((item) => {
      sheet.addRow(linhaPlanilha(item));
    });
    adicionarTotal(sheet, lancamentos);

    return {
      buffer: await getWorkbookBuffer(workbook),
      filename: `folha-${slug(nome)}-${ano}.xlsx`,
    };
  }

  async gerarPlanilhaRelatorioMensal(ano: number, mes: number) {
    const relatorio = await this.relatorioMensal(ano, mes);
    const workbook = criarWorkbook();
    const sheet = workbook.addWorksheet("Relatorio mensal");

    sheet.addRow(["Relatorio mensal da folha"]);
    sheet.addRow(["Mes", relatorio.nome_mes]);
    sheet.addRow(["Ano", ano]);
    sheet.addRow([]);
    configurarColunas(sheet, true);
    relatorio.itens.forEach((item) => sheet.addRow(linhaPlanilha(item, true)));
    adicionarTotal(sheet, relatorio.itens);

    return {
      buffer: await getWorkbookBuffer(workbook),
      filename: `relatorio-folha-${ano}-${String(mes).padStart(2, "0")}.xlsx`,
    };
  }

  private async validarParticipante(id_entidade: number) {
    const entidade = await this.folhaRepository.buscarParticipante(id_entidade);

    if (!entidade) {
      throw new BadRequestException("Entidade nao configurada para folha.");
    }

    return entidade;
  }

  private async buscarRegistroSalarialDaEntidade(
    id_entidade: number,
    id_registro_salarial: number,
    transaction?: Transaction,
  ) {
    const registro = await this.folhaRepository.buscarRegistroSalarial({
      where: { id_registro_salarial, entidade_id: id_entidade },
      transaction,
    });

    if (!registro) {
      throw new BadRequestException("Registro salarial nao encontrado.");
    }

    return registro;
  }

  private async buscarFeriasDaEntidade(
    id_entidade: number,
    id_ferias: number,
    transaction?: Transaction,
  ) {
    const ferias = await this.folhaRepository.buscarFeriasRegistro({
      where: { id_ferias, entidade_id: id_entidade },
      transaction,
    });

    if (!ferias) {
      throw new BadRequestException("Registro de ferias nao encontrado.");
    }

    return ferias;
  }

  private async buscarSalarioAtual(id_entidade: number) {
    const registro = await this.buscarSalarioVigenteData(
      id_entidade,
      hojeDateOnly(),
    );
    return registro?.salario || null;
  }

  private buscarSalarioVigenteData(
    id_entidade: number,
    data: string,
    transaction?: Transaction,
  ) {
    return this.folhaRepository.buscarRegistroSalarial({
      where: {
        entidade_id: id_entidade,
        inicio_vigencia: { [Op.lte]: data },
        [Op.or]: [{ fim_vigencia: null }, { fim_vigencia: { [Op.gte]: data } }],
      },
      order: [["inicio_vigencia", "DESC"]],
      transaction,
    });
  }

  private buscarSalarioBaseAnterior(id_entidade: number, inicioVigencia: string) {
    return this.folhaRepository.buscarRegistroSalarial({
      where: {
        entidade_id: id_entidade,
        inicio_vigencia: { [Op.lt]: inicioVigencia },
      },
      order: [["inicio_vigencia", "DESC"]],
    });
  }

  private async buscarPrimeiroRegistroSalarial(id_entidade: number) {
    const registros = await this.folhaRepository.buscarRegistrosSalariais({
      where: { entidade_id: id_entidade },
      order: [["inicio_vigencia", "ASC"]],
      limit: 1,
    });
    return registros[0] || null;
  }

  private async validarConflitoRegistroSalarial(
    id_entidade: number,
    inicio: string,
    fim: string | null,
    transaction?: Transaction,
    ignorarRegistroId?: number,
  ) {
    const fimComparacao = fim || "9999-12-31";
    const where: Record<string, unknown> = {
      entidade_id: id_entidade,
      inicio_vigencia: { [Op.lte]: fimComparacao },
      [Op.or as unknown as string]: [
        { fim_vigencia: null },
        { fim_vigencia: { [Op.gte]: inicio } },
      ],
    };

    if (ignorarRegistroId) {
      where.id_registro_salarial = { [Op.ne]: ignorarRegistroId };
    }

    const conflito = await this.folhaRepository.buscarRegistroSalarial({
      where,
      transaction,
    });

    if (conflito) {
      throw new BadRequestException(
        "Periodo salarial conflita com outro registro da pessoa.",
      );
    }
  }

  private async registrosSalariaisSimulados(
    id_entidade: number,
    id_registro_salarial: number,
    substituto: Record<string, unknown> | null,
  ): Promise<RegistroSalarialLike[]> {
    const registros = await this.folhaRepository.buscarRegistrosSalariais({
      where: { entidade_id: id_entidade },
      order: [["inicio_vigencia", "ASC"]],
    });

    return registros
      .map((registro) => registro.get({ plain: true }) as Record<string, unknown>)
      .filter(
        (registro) =>
          Number(registro.id_registro_salarial) !== id_registro_salarial,
      )
      .concat(substituto ? [substituto] : [])
      .map((registro) => ({
        id_registro_salarial: registro.id_registro_salarial,
        inicio_vigencia: registro.inicio_vigencia,
        fim_vigencia: registro.fim_vigencia,
        salario: registro.salario,
      }));
  }

  private async montarImpactoSalarial(
    id_entidade: number,
    periodos: Array<{ inicio: string; fim: string | null }>,
    registrosDepois: RegistroSalarialLike[],
  ): Promise<ImpactoSalarial> {
    const periodosValidos = periodos.filter((periodo) => periodo.inicio);
    const [ferias, lancamentos] = await Promise.all([
      this.folhaRepository.buscarFerias({
        where: { entidade_id: id_entidade },
        order: [["inicio_gozado", "ASC"]],
      }),
      this.folhaRepository.listarLancamentosMensais({ entidade_id: id_entidade }),
    ]);

    const feriasImpactadas = ferias
      .map((item) => this.toFeriasResponse(item))
      .filter((item) =>
        impactaPeriodos(
          dateOnlyValue(item.inicio_gozado),
          dateOnlyValue(item.fim_gozado),
          periodosValidos,
        ),
      )
      .map((item) => ({
        id_ferias: Number(item.id_ferias),
        inicio_gozado: item.inicio_gozado,
        fim_gozado: item.fim_gozado,
        dias_gozados: item.dias_gozados,
        valor_total_ferias: item.valor_total_ferias,
        descricao: `Ferias de ${item.inicio_gozado} a ${item.fim_gozado}`,
      }));

    const lancamentosImpactados = lancamentos
      .map((item) => item.get({ plain: true }) as Record<string, unknown>)
      .filter((item) =>
        impactaPeriodos(
          monthStartDateOnly(Number(item.ano), Number(item.mes)),
          monthEndDateOnly(Number(item.ano), Number(item.mes)),
          periodosValidos,
        ),
      )
      .map((item) => ({
        ano: Number(item.ano),
        mes: Number(item.mes),
        dias_trabalhados: Number(item.dias_trabalhados || 0),
        descricao: `Folha de pagamento ${formatarMesAno(
          Number(item.ano),
          Number(item.mes),
        )}`,
      }));

    const semSalario: Record<string, unknown>[] = [];

    feriasImpactadas.forEach((item) => {
      if (
        !temSalarioCompletoPeriodo(
          String(item.inicio_gozado),
          String(item.fim_gozado),
          registrosDepois,
        )
      ) {
        semSalario.push({
          tipo: "FERIAS",
          referencia: item.id_ferias,
          inicio: item.inicio_gozado,
          fim: item.fim_gozado,
          descricao: `${item.descricao} ficara com dias sem salario vigente.`,
        });
      }
    });

    lancamentosImpactados.forEach((item) => {
      const diasTrabalhados = Number(item.dias_trabalhados || 0);
      const diasCalculados = diasComSalarioParaTrabalhoMensal(
        diasTrabalhados,
        registrosDepois,
        Number(item.ano),
        Number(item.mes),
      );

      if (diasTrabalhados > 0 && diasCalculados < diasTrabalhados) {
        semSalario.push({
          tipo: "FOLHA",
          referencia: `${item.ano}-${String(item.mes).padStart(2, "0")}`,
          ano: item.ano,
          mes: item.mes,
          descricao: `${item.descricao} ficara com ${diasTrabalhados - diasCalculados} dia(s) sem salario vigente.`,
        });
      }
    });

    return {
      ferias: feriasImpactadas,
      lancamentos: lancamentosImpactados,
      sem_salario: semSalario,
      tem_impacto:
        feriasImpactadas.length > 0 ||
        lancamentosImpactados.length > 0 ||
        semSalario.length > 0,
    };
  }

  private async recalcularFeriasAutomaticasPeriodo(
    id_entidade: number,
    inicio: string,
    fim: string,
    transaction: Transaction,
  ) {
    const lancamentos: Record<string, unknown>[] = [];

    for (const segmento of dividirPeriodoPorMes(inicio, fim)) {
      const existente = await this.folhaRepository.buscarLancamentoMensal(
        { entidade_id: id_entidade, ano: segmento.ano, mes: segmento.mes },
        transaction,
      );
      const base = linhaBaseLancamento(existente, segmento.mes);
      const valores = await this.prepararLancamentoMensal(
        id_entidade,
        segmento.ano,
        segmento.mes,
        base,
        transaction,
      );

      await this.salvarLancamento(id_entidade, segmento.ano, valores, transaction);
      lancamentos.push({ ano: segmento.ano, ...valores });
    }

    return lancamentos;
  }

  private async recalcularFeriasAutomaticasPeriodos(
    id_entidade: number,
    periodos: Array<{ inicio: string; fim: string }>,
    transaction: Transaction,
  ) {
    const mesesImpactados = new Map<string, SegmentoMensal>();

    periodos.forEach((periodo) => {
      if (!periodo.inicio || !periodo.fim) return;

      dividirPeriodoPorMes(periodo.inicio, periodo.fim).forEach(
        (segmento) => {
          mesesImpactados.set(`${segmento.ano}-${segmento.mes}`, segmento);
        },
      );
    });

    const lancamentos: Record<string, unknown>[] = [];

    for (const segmento of mesesImpactados.values()) {
      const existente = await this.folhaRepository.buscarLancamentoMensal(
        { entidade_id: id_entidade, ano: segmento.ano, mes: segmento.mes },
        transaction,
      );
      const base = linhaBaseLancamento(existente, segmento.mes);
      const valores = await this.prepararLancamentoMensal(
        id_entidade,
        segmento.ano,
        segmento.mes,
        base,
        transaction,
      );

      await this.salvarLancamento(id_entidade, segmento.ano, valores, transaction);
      lancamentos.push({ ano: segmento.ano, ...valores });
    }

    return lancamentos;
  }

  private async recalcularFeriasRegistradas(
    id_entidade: number,
    transaction: Transaction,
    exigirSalario = false,
  ) {
    const ferias = await this.folhaRepository.buscarFerias({
      where: { entidade_id: id_entidade },
      transaction,
    });
    const recalculadas: Record<string, unknown>[] = [];

    for (const item of ferias) {
      const plain = item.get({ plain: true }) as Record<string, unknown>;
      const inicio = dateOnlyValue(plain.inicio_gozado);
      const fim = dateOnlyValue(plain.fim_gozado);
      const calculo = await this.calcularFerias(
        id_entidade,
        inicio,
        fim,
        transaction,
        exigirSalario,
      );

      await item.update(
        {
          dias_gozados: calculo.dias_gozados,
          valor_ferias: decimal(calculo.valor_ferias),
        },
        { transaction },
      );

      recalculadas.push(this.toFeriasResponse(item));
    }

    return recalculadas;
  }

  private async recalcularLancamentosSalvos(
    id_entidade: number,
    transaction: Transaction,
    exigirSalario = false,
  ) {
    const existentes = await this.folhaRepository.listarLancamentosMensais(
      { entidade_id: id_entidade },
      transaction,
    );
    const lancamentos: Record<string, unknown>[] = [];

    for (const existente of existentes) {
      const ano = Number(existente.ano);
      const mes = Number(existente.mes);
      const valores = await this.prepararLancamentoMensal(
        id_entidade,
        ano,
        mes,
        linhaBaseLancamento(existente, mes),
        transaction,
        undefined,
        exigirSalario,
      );

      await this.salvarLancamento(id_entidade, ano, valores, transaction);
      lancamentos.push({ ano, ...valores });
    }

    return lancamentos;
  }

  private async montarLancamentosAno(
    id_entidade: number,
    ano: number,
    lancamentos: FolhaMensal[],
  ) {
    const porMes = new Map(
      lancamentos.map((item) => [Number(item.mes), item]),
    );

    return Promise.all(
      meses.map((_, index) =>
        this.enriquecerLancamentoMensal(
          id_entidade,
          ano,
          index + 1,
          porMes.get(index + 1) || null,
        ),
      ),
    );
  }

  private enriquecerLancamentoMensal(
    id_entidade: number,
    ano: number,
    mes: number,
    lancamento: FolhaMensal | null,
    transaction?: Transaction,
  ) {
    const plain = (lancamento?.get({ plain: true }) || {}) as Record<
      string,
      unknown
    >;
    return this.prepararLancamentoMensal(
      id_entidade,
      ano,
      mes,
      linhaBaseLancamento(lancamento, mes),
      transaction,
      undefined,
      false,
    ).then((valores) => ({ ...plain, ...valores }));
  }

  private async prepararLancamentoMensal(
    id_entidade: number,
    ano: number,
    mes: number,
    linha: LinhaFolha,
    transaction?: Transaction,
    periodoTrabalhado?: { inicio: string; fim: string },
    exigirSalario = true,
  ) {
    const inicioMes = monthStartDateOnly(ano, mes);
    const fimMes = monthEndDateOnly(ano, mes);
    const registrosSalariais = await this.buscarRegistrosSalariaisPeriodo(
      id_entidade,
      inicioMes,
      fimMes,
      transaction,
    );
    const salarioMensal = buscarSalarioMensalVigenteMes(
      registrosSalariais,
      ano,
      mes,
    );
    const diasTrabalhados = numero(linha.dias_trabalhados);
    const salarioProporcional = periodoTrabalhado
      ? calcularValorPeriodoComSalarios(
          periodoTrabalhado.inicio,
          periodoTrabalhado.fim,
          registrosSalariais,
        )
      : calcularSalarioProporcionalDiasMes(
          diasTrabalhados,
          registrosSalariais,
          ano,
          mes,
          exigirSalario,
        );
    const feriasMes = await this.calcularFeriasMes(
      id_entidade,
      ano,
      mes,
      transaction,
    );

    if (exigirSalario && diasTrabalhados > 0 && salarioMensal <= 0) {
      throw new BadRequestException(
        `Não existe registro salarial para ${String(mes).padStart(2, "0")}/${ano}.`,
      );
    }

    return calcularLinha({
      ...linha,
      mes,
      dias_trabalhados: diasTrabalhados,
      salario_bruto: salarioMensal,
      salario_proporcional: salarioProporcional,
      ferias: feriasMes.valor,
      ferias_automatica: feriasMes.automatica,
    });
  }

  private async calcularFerias(
    id_entidade: number,
    inicio: string,
    fim: string,
    transaction?: Transaction,
    exigirSalario = true,
  ) {
    const registrosSalariais = await this.buscarRegistrosSalariaisPeriodo(
      id_entidade,
      inicio,
      fim,
      transaction,
    );

    return {
      dias_gozados: diasInclusivos(inicio, fim),
      valor_ferias: calcularValorPeriodoComSalarios(
        inicio,
        fim,
        registrosSalariais,
        exigirSalario,
      ),
    };
  }

  private async calcularFeriasMes(
    id_entidade: number,
    ano: number,
    mes: number,
    transaction?: Transaction,
  ) {
    const inicioMes = monthStartDateOnly(ano, mes);
    const fimMes = monthEndDateOnly(ano, mes);
    const ferias = await this.folhaRepository.buscarFerias({
      where: {
        entidade_id: id_entidade,
        inicio_gozado: { [Op.between]: [inicioMes, fimMes] },
      },
      transaction,
    });

    if (!ferias.length) {
      return { valor: 0, automatica: false };
    }

    const valor = ferias.reduce((total, item) => {
      const plain = item.get({ plain: true }) as Record<string, unknown>;
      return (
        total +
        numero(plain.valor_ferias) +
        numero(plain.valor_abono)
      );
    }, 0);

    return { valor, automatica: true };
  }

  private buscarRegistrosSalariaisPeriodo(
    id_entidade: number,
    inicio: string,
    fim: string,
    transaction?: Transaction,
  ) {
    return this.folhaRepository.buscarRegistrosSalariais({
      where: {
        entidade_id: id_entidade,
        inicio_vigencia: { [Op.lte]: fim },
        [Op.or]: [
          { fim_vigencia: null },
          { fim_vigencia: { [Op.gte]: inicio } },
        ],
      },
      order: [["inicio_vigencia", "ASC"]],
      transaction,
    });
  }

  private async salvarLancamento(
    id_entidade: number,
    ano: number,
    valores: LinhaCalculada,
    transaction: Transaction,
  ) {
    const {
      salario_mensal_vigente,
      salario_proporcional,
      salario_final_com_ferias,
      ...valoresPersistidos
    } = valores;
    const existente = await this.folhaRepository.buscarLancamentoMensal(
      { entidade_id: id_entidade, ano, mes: valores.mes },
      transaction,
    );

    if (existente) {
      await existente.update(valoresPersistidos, { transaction });
      return;
    }

    await this.folhaRepository.criarLancamentoMensal(
      { entidade_id: id_entidade, ano, ...valoresPersistidos },
      transaction,
    );
  }

  private async calcularResumoFerias(
    entidade: Entidade,
    id_entidade: number,
    totalDiasGozados: number,
  ) {
    const dataAdmissao = dateOnlyValue(entidade.data_admissao);
    const primeiroSalario = dataAdmissao
      ? null
      : await this.buscarPrimeiroRegistroSalarial(id_entidade);
    const referencia =
      dataAdmissao || dateOnlyValue(primeiroSalario?.inicio_vigencia);

    if (!referencia) {
      return {
        referencia_inicio: null,
        periodo_aquisitivo_inicio: null,
        periodo_aquisitivo_fim: null,
        anos_aquisitivos: 0,
        dias_adquiridos: 0,
        total_dias_gozados: totalDiasGozados,
        saldo_ferias_dias: -totalDiasGozados,
      };
    }

    const hoje = hojeDateOnly();

    if (referencia > hoje) {
      return {
        referencia_inicio: referencia,
        periodo_aquisitivo_inicio: referencia,
        periodo_aquisitivo_fim: formatDateOnly(
          addDays(parseDateOnly(referencia), 364),
        ),
        anos_aquisitivos: 0,
        dias_adquiridos: 0,
        total_dias_gozados: totalDiasGozados,
        saldo_ferias_dias: -totalDiasGozados,
      };
    }

    const diasCorridos = diasInclusivos(referencia, hoje);
    const anos = diasCorridos / 365;
    const ciclosCompletos = Math.floor((diasCorridos - 1) / 365);
    const periodoInicio = formatDateOnly(
      addDays(parseDateOnly(referencia), ciclosCompletos * 365),
    );
    const periodoFim = formatDateOnly(
      addDays(parseDateOnly(periodoInicio), 364),
    );
    const diasAdquiridos = Math.round(anos * 30);

    return {
      referencia_inicio: referencia,
      periodo_aquisitivo_inicio: periodoInicio,
      periodo_aquisitivo_fim: periodoFim,
      anos_aquisitivos: Number(anos.toFixed(2)),
      dias_adquiridos: diasAdquiridos,
      total_dias_gozados: totalDiasGozados,
      saldo_ferias_dias: diasAdquiridos - totalDiasGozados,
    };
  }

  private toEntidadeResponse(entidade: Entidade) {
    const plain = entidade.get({ plain: true }) as Record<string, unknown> & {
      tipos?: Array<{ tipo: string }>;
    };
    return { ...plain, tipos: plain.tipos?.map((item) => item.tipo) || [] };
  }

  private toFeriasResponse(ferias: Ferias): Record<string, unknown> & {
    id_ferias?: unknown;
    inicio_gozado: string;
    fim_gozado: string;
    dias_gozados: number;
    valor_ferias: string;
    valor_abono: string;
    valor_total_ferias: string;
  } {
    const plain = ferias.get({ plain: true }) as Record<string, unknown>;

    return {
      ...plain,
      inicio_gozado: dateOnlyValue(plain.inicio_gozado),
      fim_gozado: dateOnlyValue(plain.fim_gozado),
      dias_gozados: Number(plain.dias_gozados || 0),
      valor_ferias: decimal(plain.valor_ferias),
      valor_abono: decimal(plain.valor_abono),
      valor_total_ferias: decimal(
        numero(plain.valor_ferias) + numero(plain.valor_abono),
      ),
    };
  }


}
