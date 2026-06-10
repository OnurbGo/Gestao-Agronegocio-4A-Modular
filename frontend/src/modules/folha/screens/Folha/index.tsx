import { useCallback, useMemo, useState } from "react";
import { FileText, Table2 } from "lucide-react";
import {
  atualizarEntidade,
  listarEntidades,
} from "@/shared/services/entidades.service";
import StatusMessage from "@/shared/components/feedback/StatusMessage";
import { Button } from "@/shared/components/ui/button";
import { normalizePaginated } from "@/shared/services/api";
import { getApiErrorMessage } from "@/shared/services/api-error";
import {
  notifyError,
  notifyInfo,
  notifySuccess,
  notifyWarning,
} from "@/shared/services/feedback";
import PayrollDiscountsModal from "./components/PayrollDiscountsModal";
import PayrollMonthlyEntriesPanel from "./components/PayrollMonthlyEntriesPanel";
import PayrollParticipantsModal from "./components/PayrollParticipantsModal";
import PayrollParticipantsPanel from "./components/PayrollParticipantsPanel";
import PayrollRecordsOverview from "./components/PayrollRecordsOverview";
import PayrollReportPanel from "./components/PayrollReportPanel";
import SalaryImpactModal from "./components/SalaryImpactModal";
import SalaryRecordsModal from "./components/SalaryRecordsModal";
import VacationRecordsModal from "./components/VacationRecordsModal";
import PayrollSummaryCards from "./components/PayrollSummaryCards";
import {
  ENTITIES_MODAL_PAGE_SIZE,
  feriasInicial,
  meses,
  salarioInicial,
} from "./constants";
import { usePayrollMonthlyEntries } from "./hooks/usePayrollMonthlyEntries";
import { usePayrollParticipants } from "./hooks/usePayrollParticipants";
import { usePayrollReport } from "./hooks/usePayrollReport";
import { useSalaryRecords } from "./hooks/useSalaryRecords";
import { useVacationRecords } from "./hooks/useVacationRecords";
import {
  atualizarFerias,
  atualizarRegistroSalarial,
  buscarImpactoEdicaoRegistroSalarial,
  buscarImpactoExclusaoRegistroSalarial,
  buscarPercentualSugerido,
  criarFerias,
  criarRegistroSalarial,
  exportarLancamentosMensais,
  exportarRelatorioMensal,
  removerFerias,
  removerRegistroSalarial,
  salvarLancamentosMensais,
} from "@/shared/services/folha.service";
import {
  calcularLinha,
  dinheiro,
  montarPayload,
  normalizarLinha,
  numero,
  possuiImpactoSalarial,
} from "./helpers";

function FolhaPage({ onBack }) {
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;

  const [aba, setAba] = useState("relatorio");
  const [termo, setTermo] = useState("");
  const [ano, setAno] = useState(anoAtual);
  const [mesRelatorio, setMesRelatorio] = useState(mesAtual);
  const [participantePage, setParticipantePage] = useState(1);
  const [salarioPage, setSalarioPage] = useState(1);
  const [feriasPage, setFeriasPage] = useState(1);
  const [salvando, setSalvando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [status, setStatus] = useState(null);
  const [modalAberto, setModalAberto] = useState(null);
  const [mesDescontos, setMesDescontos] = useState(null);
  const [entidadesFolha, setEntidadesFolha] = useState([]);
  const [termoEntidadesFolha, setTermoEntidadesFolha] = useState("");
  const [entidadesFolhaPage, setEntidadesFolhaPage] = useState(1);
  const [entidadesFolhaMeta, setEntidadesFolhaMeta] = useState(() =>
    normalizePaginated([], ENTITIES_MODAL_PAGE_SIZE),
  );
  const [carregandoEntidadesFolha, setCarregandoEntidadesFolha] =
    useState(false);
  const [salvandoParticipante, setSalvandoParticipante] = useState(null);
  const [salarioForm, setSalarioForm] = useState(salarioInicial);
  const [feriasForm, setFeriasForm] = useState(feriasInicial);
  const [salarioError, setSalarioError] = useState(null);
  const [feriasError, setFeriasError] = useState(null);
  const [participantesError, setParticipantesError] = useState(null);
  const [salarioEditandoId, setSalarioEditandoId] = useState(null);
  const [feriasEditandoId, setFeriasEditandoId] = useState(null);
  const [impactoSalarial, setImpactoSalarial] = useState(null);
  const [processandoImpacto, setProcessandoImpacto] = useState(false);

  const limparStatus = useCallback(() => setStatus(null), []);
  const mostrarErro = useCallback((message) => {
    notifyError(message);
  }, []);

  const {
    participanteId,
    participantes,
    participantesMeta,
    recarregarParticipantes,
    setParticipanteId,
  } = usePayrollParticipants({
    onError: mostrarErro,
    onLoadStart: limparStatus,
    page: participantePage,
    search: termo,
  });

  const {
    alterado,
    carregando,
    detalhe,
    linhas,
    recarregarDetalheELancamentos,
    setAlterado,
    setLinhas,
  } = usePayrollMonthlyEntries({
    onError: mostrarErro,
    onLoadStart: limparStatus,
    participantId: participanteId,
    year: ano,
  });

  const { relatorio, recarregarRelatorio: carregarRelatorio } =
    usePayrollReport({
      month: mesRelatorio,
      year: ano,
    });

  const { registrosSalariais, recarregarSalarios, salarioMeta } =
    useSalaryRecords({
      onError: mostrarErro,
      page: salarioPage,
      participantId: participanteId,
    });

  const { ferias, feriasMeta, feriasSummary, recarregarFerias } =
    useVacationRecords({
      onError: mostrarErro,
      page: feriasPage,
      participantId: participanteId,
    });
  const totais = useMemo(
    () =>
      linhas.reduce(
        (acc, linha) => ({
          bruto: acc.bruto + numero(linha.salario_bruto),
          liquido: acc.liquido + numero(linha.salario_liquido),
          final: acc.final + numero(linha.salario_liquido_com_desconto),
          finalComFerias:
            acc.finalComFerias + numero(linha.salario_final_com_ferias),
        }),
        { bruto: 0, liquido: 0, final: 0, finalComFerias: 0 },
      ),
    [linhas],
  );

  const linhaDescontos = useMemo(
    () => linhas.find((linha) => linha.mes === mesDescontos),
    [linhas, mesDescontos],
  );

  async function recarregarAposAlteracaoSalarial() {
    setSalarioPage(1);
    setFeriasPage(1);
    await recarregarDetalheELancamentos();
    await recarregarSalarios(1);
    await recarregarFerias(1);
    await recarregarParticipantes();
    await carregarRelatorio();
  }

  function limparEdicaoSalario() {
    setSalarioForm(salarioInicial);
    setSalarioEditandoId(null);
    setImpactoSalarial(null);
    setSalarioError(null);
  }

  function montarPayloadSalario() {
    return {
      inicio_vigencia: salarioForm.inicio_vigencia,
      fim_vigencia: salarioForm.fim_vigencia || null,
      salario: numero(salarioForm.salario),
      percentual: salarioForm.percentual
        ? numero(salarioForm.percentual)
        : null,
      observacao: salarioForm.observacao || null,
    };
  }

  async function executarSalvarSalario(
    payload,
    registroId = salarioEditandoId,
  ) {
    if (registroId) {
      await atualizarRegistroSalarial(participanteId, registroId, payload);
    } else {
      await criarRegistroSalarial(participanteId, payload);
    }

    const estavaEditando = Boolean(registroId);
    limparEdicaoSalario();
    await recarregarAposAlteracaoSalarial();
    notifySuccess(
      estavaEditando
        ? "Registro salarial atualizado."
        : "Registro salarial criado.",
    );
  }

  async function executarExcluirSalario(registro) {
    await removerRegistroSalarial(
      participanteId,
      registro.id_registro_salarial,
    );

    if (salarioEditandoId === registro.id_registro_salarial) {
      limparEdicaoSalario();
    } else {
      setImpactoSalarial(null);
    }

    await recarregarAposAlteracaoSalarial();
    notifySuccess("Registro salarial excluído.");
  }

  function editarSalario(registro) {
    setSalarioEditandoId(registro.id_registro_salarial);
    setSalarioForm({
      inicio_vigencia: registro.inicio_vigencia || "",
      fim_vigencia: registro.fim_vigencia || "",
      salario: registro.salario || "",
      percentual: registro.percentual || "",
      observacao: registro.observacao || "",
    });
    setStatus(null);
    setSalarioError(null);
  }

  async function excluirSalario(registro) {
    if (!participanteId) return;

    setStatus(null);
    setSalarioError(null);
    try {
      const impacto = await buscarImpactoExclusaoRegistroSalarial(
        participanteId,
        registro.id_registro_salarial,
      );

      if (possuiImpactoSalarial(impacto)) {
        setImpactoSalarial({
          acao: "excluir",
          titulo: "Excluir registro salarial",
          mensagem: "Excluir isso vai modificar:",
          registro,
          impacto,
        });
        return;
      }

      await executarExcluirSalario(registro);
    } catch (error) {
      setSalarioError(
        getApiErrorMessage(
          error,
          "Não foi possível excluir o registro salarial.",
        ),
      );
    }
  }

  async function confirmarImpactoSalarial() {
    if (!impactoSalarial || !participanteId) return;

    setProcessandoImpacto(true);
    setStatus(null);

    try {
      if (impactoSalarial.acao === "editar") {
        await executarSalvarSalario(
          impactoSalarial.payload,
          impactoSalarial.registroId,
        );
      } else {
        await executarExcluirSalario(impactoSalarial.registro);
      }
    } catch (error) {
      notifyError(
        getApiErrorMessage(error, "Não foi possível confirmar o impacto."),
      );
    } finally {
      setProcessandoImpacto(false);
    }
  }

  function limparEdicaoFerias() {
    setFeriasForm(feriasInicial);
    setFeriasEditandoId(null);
    setFeriasError(null);
  }

  function editarFerias(item) {
    setFeriasEditandoId(item.id_ferias);
    setFeriasForm({
      inicio_gozado: item.inicio_gozado || "",
      fim_gozado: item.fim_gozado || "",
      valor_abono: numero(item.valor_abono) > 0 ? String(item.valor_abono) : "",
    });
    setStatus(null);
    setFeriasError(null);
  }

  async function excluirFerias(item) {
    if (!participanteId) return;

    setStatus(null);
    setFeriasError(null);
    try {
      await removerFerias(participanteId, item.id_ferias);
      if (feriasEditandoId === item.id_ferias) {
        limparEdicaoFerias();
      }
      setFeriasPage(1);
      await recarregarDetalheELancamentos();
      await recarregarFerias(1);
      await carregarRelatorio();
      notifySuccess("Férias excluídas.");
    } catch (error) {
      setFeriasError(
        getApiErrorMessage(error, "Não foi possível excluir as férias."),
      );
    }
  }

  function alterarLinha(mes, campo, valor) {
    setLinhas((atuais) =>
      atuais.map((linha) =>
        linha.mes === mes
          ? calcularLinha(
              { ...linha, [campo]: valor },
              campo === "dias_trabalhados",
            )
          : linha,
      ),
    );
    setAlterado(true);
    setStatus(null);
  }

  function abrirDescontos(mes) {
    setMesDescontos(mes);
    setModalAberto("descontos");
  }

  async function carregarEntidadesFolha(pageToLoad = entidadesFolhaPage) {
    setCarregandoEntidadesFolha(true);
    setStatus(null);
    setParticipantesError(null);

    try {
      const data = normalizePaginated(
        await listarEntidades({
          ativo: true,
          page: pageToLoad,
          limit: ENTITIES_MODAL_PAGE_SIZE,
          search: termoEntidadesFolha,
        }),
        ENTITIES_MODAL_PAGE_SIZE,
      );
      setEntidadesFolha(data.items);
      setEntidadesFolhaMeta(data);
      setEntidadesFolhaPage(data.page);
    } catch (error) {
      setParticipantesError(
        getApiErrorMessage(error, "Erro ao carregar participantes."),
      );
    } finally {
      setCarregandoEntidadesFolha(false);
    }
  }

  async function abrirParticipantes() {
    setModalAberto("participantes");
    setParticipantesError(null);
    setEntidadesFolhaPage(1);
    await carregarEntidadesFolha(1);
  }

  async function alternarParticipacao(entidade) {
    const id = entidade.id_entidade;
    const participa = !entidade.participa_folha;

    setSalvandoParticipante(id);
    setStatus(null);
    setParticipantesError(null);

    try {
      const atualizada = await atualizarEntidade(id, {
        participa_folha: participa,
      });
      setEntidadesFolha((atuais) =>
        atuais.map((item) =>
          item.id_entidade === id
            ? { ...item, participa_folha: atualizada.participa_folha }
            : item,
        ),
      );
      await recarregarParticipantes();
      await carregarRelatorio();
      notifySuccess("Participação na folha atualizada.");
    } catch (error) {
      setParticipantesError(
        getApiErrorMessage(error, "Não foi possível atualizar a participação."),
      );
    } finally {
      setSalvandoParticipante(null);
    }
  }

  async function salvar() {
    if (!participanteId) return;
    setSalvando(true);
    setStatus(null);

    try {
      const registros = await salvarLancamentosMensais(
        participanteId,
        Number(ano),
        montarPayload(linhas),
      );
      const porMes = new Map(
        registros.map((linha) => [Number(linha.mes), linha]),
      );
      setLinhas(
        meses.map((mes) => normalizarLinha(porMes.get(mes.valor), mes.valor)),
      );
      setAlterado(false);
      notifySuccess("Lançamentos salvos.");
      await carregarRelatorio();
    } catch (error) {
      notifyError(getApiErrorMessage(error, "Erro ao salvar lançamentos."));
    } finally {
      setSalvando(false);
    }
  }

  async function exportar() {
    if (!participanteId || alterado) return;
    setExportando(true);
    setStatus(null);

    try {
      await exportarLancamentosMensais(participanteId, ano, detalhe?.nome);
    } catch (error) {
      notifyError(getApiErrorMessage(error, "Erro ao exportar lançamentos."));
    } finally {
      setExportando(false);
    }
  }

  async function adicionarSalario(event) {
    event.preventDefault();
    if (!participanteId) return;

    setStatus(null);
    setSalarioError(null);
    try {
      const payload = montarPayloadSalario();

      if (salarioEditandoId) {
        const impacto = await buscarImpactoEdicaoRegistroSalarial(
          participanteId,
          salarioEditandoId,
          payload,
        );

        if (possuiImpactoSalarial(impacto)) {
          setImpactoSalarial({
            acao: "editar",
            titulo: "Editar registro salarial",
            mensagem: "Editar isso vai modificar:",
            registroId: salarioEditandoId,
            payload,
            impacto,
          });
          return;
        }
      }

      await executarSalvarSalario(payload);
    } catch (error) {
      setSalarioError(
        getApiErrorMessage(
          error,
          "Não foi possível salvar o registro salarial.",
        ),
      );
    }
  }

  async function calcularPercentualSalario() {
    if (
      !participanteId ||
      !salarioForm.inicio_vigencia ||
      !salarioForm.salario
    ) {
      setSalarioError("Informe data e salário para calcular o percentual.");
      return;
    }

    setStatus(null);
    setSalarioError(null);

    try {
      const sugestao = await buscarPercentualSugerido(participanteId, {
        inicio_vigencia: salarioForm.inicio_vigencia,
        salario: salarioForm.salario,
      });

      if (sugestao.percentual_sugerido === null) {
        setSalarioError(
          "Não existe salário anterior para sugerir o percentual.",
        );
        return;
      }

      setSalarioForm((form) => ({
        ...form,
        percentual: String(sugestao.percentual_sugerido),
      }));
      notifyInfo(
        `Percentual sugerido com base em ${dinheiro(sugestao.salario_base)}.`,
      );
    } catch (error) {
      setSalarioError(
        getApiErrorMessage(error, "Não foi possível calcular o percentual."),
      );
    }
  }

  async function adicionarFerias(event) {
    event.preventDefault();
    if (!participanteId) return;

    setStatus(null);
    setFeriasError(null);
    try {
      const payload = {
        inicio_gozado: feriasForm.inicio_gozado,
        fim_gozado: feriasForm.fim_gozado,
        ...(feriasForm.valor_abono
          ? { valor_abono: numero(feriasForm.valor_abono) }
          : {}),
      };

      if (feriasEditandoId) {
        await atualizarFerias(participanteId, feriasEditandoId, payload);
      } else {
        await criarFerias(participanteId, payload);
      }

      const estavaEditando = Boolean(feriasEditandoId);
      limparEdicaoFerias();
      setFeriasPage(1);
      await recarregarDetalheELancamentos();
      await recarregarFerias(1);
      await carregarRelatorio();
      notifySuccess(
        estavaEditando ? "Férias atualizadas." : "Férias cadastradas.",
      );
    } catch (error) {
      setFeriasError(
        getApiErrorMessage(error, "Não foi possível salvar as férias."),
      );
    }
  }

  async function exportarRelatorio() {
    setStatus(null);
    try {
      await exportarRelatorioMensal({ ano, mes: mesRelatorio });
    } catch (error) {
      notifyError(getApiErrorMessage(error, "Erro ao exportar relatório."));
    }
  }

  function imprimirRelatorio() {
    if (!relatorio?.itens?.length) {
      notifyWarning("Não há dados para imprimir neste relatório.");
      return;
    }

    setStatus(null);
    try {
      window.print();
    } catch (error) {
      notifyError(getApiErrorMessage(error, "Falha ao abrir impressão."));
    }
  }

  return (
    <main className="flex flex-col gap-5 px-5 py-7 sm:px-7">
      <section className="no-print flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button onClick={onBack} type="button" variant="outline">
          Voltar
        </Button>
        <div>
          <span className="text-xs font-black uppercase tracking-wide text-emerald-800">
            Folha
          </span>
          <h1 className="mt-1 text-4xl font-bold leading-tight text-slate-950">
            Folha de Pagamento
          </h1>
        </div>
      </section>

      <StatusMessage status={status} />

      {alterado ? (
        <StatusMessage
          status={{
            type: "warning",
            message: "Existem alterações pendentes. Salve antes de exportar.",
          }}
        />
      ) : null}

      <div className="no-print flex gap-2 border-b border-emerald-100 pb-3">
        <Button
          onClick={() => setAba("relatorio")}
          type="button"
          variant={aba === "relatorio" ? "default" : "outline"}
        >
          <FileText aria-hidden="true" />
          Relatório mensal
        </Button>
        <Button
          onClick={() => setAba("lancamentos")}
          type="button"
          variant={aba === "lancamentos" ? "default" : "outline"}
        >
          <Table2 aria-hidden="true" />
          Lançamentos
        </Button>
      </div>

      {aba === "relatorio" ? (
        <PayrollReportPanel
          ano={ano}
          mesRelatorio={mesRelatorio}
          onAnoChange={setAno}
          onExport={exportarRelatorio}
          onMesRelatorioChange={setMesRelatorio}
          onPrint={imprimirRelatorio}
          relatorio={relatorio}
        />
      ) : (
        <section className="grid w-full min-w-0 max-w-full items-start gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
          <PayrollParticipantsPanel
            meta={participantesMeta}
            onManage={abrirParticipantes}
            onSearchChange={(value) => {
              setParticipantePage(1);
              setTermo(value);
            }}
            onSelect={(participante) => {
              limparEdicaoSalario();
              limparEdicaoFerias();
              setParticipantesError(null);
              setParticipanteId(participante.id_entidade);
              setSalarioPage(1);
              setFeriasPage(1);
            }}
            page={participantePage}
            participants={participantes}
            search={termo}
            selectedId={participanteId}
            setPage={setParticipantePage}
          />

          <section className="grid min-w-0 max-w-full gap-5">
            <PayrollSummaryCards detail={detalhe} totals={totais} />
            <PayrollMonthlyEntriesPanel
              changed={alterado}
              exporting={exportando}
              loading={carregando}
              onChange={alterarLinha}
              onExport={exportar}
              onOpenDiscounts={abrirDescontos}
              onSave={salvar}
              onYearChange={setAno}
              participantId={participanteId}
              rows={linhas}
              saving={salvando}
              year={ano}
            />
            <PayrollRecordsOverview
              onOpenSalaryRecords={() => {
                setSalarioError(null);
                setModalAberto("salarios");
              }}
              onOpenVacationRecords={() => {
                setFeriasError(null);
                setModalAberto("ferias");
              }}
              participantId={participanteId}
              salaryMeta={salarioMeta}
              salaryRecords={registrosSalariais}
              vacationMeta={feriasMeta}
              vacationRecords={ferias}
            />
          </section>
        </section>
      )}

      <PayrollParticipantsModal
        entities={entidadesFolha}
        errorMessage={participantesError}
        loading={carregandoEntidadesFolha}
        meta={entidadesFolhaMeta}
        onClearError={() => setParticipantesError(null)}
        onClose={() => {
          setParticipantesError(null);
          setModalAberto(null);
        }}
        onLoadPage={carregarEntidadesFolha}
        onSearchChange={(value) => {
          setParticipantesError(null);
          setTermoEntidadesFolha(value);
        }}
        onToggle={alternarParticipacao}
        open={modalAberto === "participantes"}
        page={entidadesFolhaPage}
        savingId={salvandoParticipante}
        search={termoEntidadesFolha}
      />
      <PayrollDiscountsModal
        linha={modalAberto === "descontos" ? linhaDescontos : null}
        onChange={alterarLinha}
        onClose={() => setModalAberto(null)}
      />
      <SalaryRecordsModal
        editingId={salarioEditandoId}
        errorMessage={salarioError}
        form={salarioForm}
        meta={salarioMeta}
        onCalculatePercentage={calcularPercentualSalario}
        onCancelEdit={limparEdicaoSalario}
        onClearError={() => setSalarioError(null)}
        onClose={() => {
          limparEdicaoSalario();
          setModalAberto(null);
        }}
        onDelete={excluirSalario}
        onEdit={editarSalario}
        onSubmit={adicionarSalario}
        open={modalAberto === "salarios"}
        page={salarioPage}
        records={registrosSalariais}
        setForm={setSalarioForm}
        setPage={setSalarioPage}
      />
      <SalaryImpactModal
        impacto={impactoSalarial}
        onCancel={() => setImpactoSalarial(null)}
        onConfirm={confirmarImpactoSalarial}
        processing={processandoImpacto}
      />
      <VacationRecordsModal
        editingId={feriasEditandoId}
        errorMessage={feriasError}
        form={feriasForm}
        meta={feriasMeta}
        onCancelEdit={limparEdicaoFerias}
        onClearError={() => setFeriasError(null)}
        onClose={() => {
          limparEdicaoFerias();
          setModalAberto(null);
        }}
        onDelete={excluirFerias}
        onEdit={editarFerias}
        onSubmit={adicionarFerias}
        open={modalAberto === "ferias"}
        page={feriasPage}
        records={ferias}
        setForm={setFeriasForm}
        setPage={setFeriasPage}
        summary={feriasSummary}
      />
    </main>
  );
}

export default FolhaPage;
