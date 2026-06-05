import { useEffect, useMemo, useState } from "react";
import {
  atualizarEntidade,
  listarEntidades,
} from "@/modules/entidades/services/entidades.service";
import ReportHeader from "@/shared/components/data-display/ReportHeader";
import Modal from "@/shared/components/layout/Modal";
import StatusMessage from "@/shared/components/feedback/StatusMessage";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { normalizePaginated } from "@/shared/services/api";
import { formatDateBR, formatDateTimeBR } from "@/shared/utils/date";
import MoneyInput from "../components/MoneyInput";
import PayrollMonthlyChart from "../components/PayrollMonthlyChart";
import {
  atualizarFerias,
  atualizarRegistroSalarial,
  buscarImpactoEdicaoRegistroSalarial,
  buscarImpactoExclusaoRegistroSalarial,
  buscarParticipante,
  buscarPercentualSugerido,
  buscarRelatorioMensal,
  criarFerias,
  criarRegistroSalarial,
  exportarLancamentosMensais,
  exportarRelatorioMensal,
  listarLancamentosMensais,
  listarFerias,
  listarParticipantes,
  listarRegistrosSalariais,
  removerFerias,
  removerRegistroSalarial,
  salvarLancamentosMensais,
} from "../services/folha.service";
import {
  calcularLinha,
  criarLinhaBase,
  descontoCampos,
  dinheiro,
  mesAno,
  montarPayload,
  normalizarLinha,
  numero,
  possuiImpactoSalarial,
  totalDescontos,
} from "../utils";

const meses = [
  { valor: 1, label: "Janeiro" },
  { valor: 2, label: "Fevereiro" },
  { valor: 3, label: "Março" },
  { valor: 4, label: "Abril" },
  { valor: 5, label: "Maio" },
  { valor: 6, label: "Junho" },
  { valor: 7, label: "Julho" },
  { valor: 8, label: "Agosto" },
  { valor: 9, label: "Setembro" },
  { valor: 10, label: "Outubro" },
  { valor: 11, label: "Novembro" },
  { valor: 12, label: "Dezembro" },
];

const PARTICIPANTS_PAGE_SIZE = 10;
const ENTITIES_MODAL_PAGE_SIZE = 10;
const SALARY_PAGE_SIZE = 5;
const VACATION_PAGE_SIZE = 5;

const salarioInicial = {
  inicio_vigencia: "",
  fim_vigencia: "",
  salario: "",
  percentual: "",
  observacao: "",
};

const feriasInicial = {
  inicio_gozado: "",
  fim_gozado: "",
  valor_abono: "",
};

const feriasSummaryInicial = {
  referencia_inicio: null,
  periodo_aquisitivo_inicio: null,
  periodo_aquisitivo_fim: null,
  anos_aquisitivos: 0,
  dias_adquiridos: 0,
  total_dias_gozados: 0,
  saldo_ferias_dias: 0,
};

function FolhaPage({ onBack }) {
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;

  const [aba, setAba] = useState("relatorio");
  const [termo, setTermo] = useState("");
  const [ano, setAno] = useState(anoAtual);
  const [mesRelatorio, setMesRelatorio] = useState(mesAtual);
  const [participantes, setParticipantes] = useState([]);
  const [participantePage, setParticipantePage] = useState(1);
  const [participantesMeta, setParticipantesMeta] = useState(() =>
    normalizePaginated([], PARTICIPANTS_PAGE_SIZE),
  );
  const [participanteId, setParticipanteId] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const [linhas, setLinhas] = useState(() =>
    meses.map((mes) => criarLinhaBase(mes.valor)),
  );
  const [relatorio, setRelatorio] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [status, setStatus] = useState(null);
  const [alterado, setAlterado] = useState(false);
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
  const [registrosSalariais, setRegistrosSalariais] = useState([]);
  const [salarioPage, setSalarioPage] = useState(1);
  const [salarioMeta, setSalarioMeta] = useState(() =>
    normalizePaginated([], SALARY_PAGE_SIZE),
  );
  const [ferias, setFerias] = useState([]);
  const [feriasPage, setFeriasPage] = useState(1);
  const [feriasMeta, setFeriasMeta] = useState(() =>
    normalizePaginated([], VACATION_PAGE_SIZE),
  );
  const [feriasSummary, setFeriasSummary] = useState(feriasSummaryInicial);
  const [salarioForm, setSalarioForm] = useState(salarioInicial);
  const [feriasForm, setFeriasForm] = useState(feriasInicial);
  const [salarioEditandoId, setSalarioEditandoId] = useState(null);
  const [feriasEditandoId, setFeriasEditandoId] = useState(null);
  const [impactoSalarial, setImpactoSalarial] = useState(null);
  const [processandoImpacto, setProcessandoImpacto] = useState(false);

  useEffect(() => {
    let active = true;

    async function carregar() {
      setStatus(null);

      try {
        const data = normalizePaginated(
          await listarParticipantes({
            termo,
            page: participantePage,
            limit: PARTICIPANTS_PAGE_SIZE,
          }),
          PARTICIPANTS_PAGE_SIZE,
        );

        if (!active) return;
        setParticipantes(data.items);
        setParticipantesMeta(data);
        setParticipanteId(
          (current) => current || data.items[0]?.id_entidade || null,
        );
      } catch (error) {
        if (active) setStatus({ type: "error", message: error.message });
      }
    }

    carregar();
    return () => {
      active = false;
    };
  }, [termo, participantePage]);

  useEffect(() => {
    if (!participanteId) {
      return;
    }

    let active = true;

    async function carregar() {
      setCarregando(true);
      setStatus(null);

      try {
        const [participante, lancamentos] = await Promise.all([
          buscarParticipante(participanteId),
          listarLancamentosMensais(participanteId, ano),
        ]);
        const porMes = new Map(
          lancamentos.map((linha) => [Number(linha.mes), linha]),
        );

        if (!active) return;
        setDetalhe(participante);
        setLinhas(
          meses.map((mes) => normalizarLinha(porMes.get(mes.valor), mes.valor)),
        );
        setAlterado(false);
      } catch (error) {
        if (active) setStatus({ type: "error", message: error.message });
      } finally {
        if (active) setCarregando(false);
      }
    }

    carregar();
    return () => {
      active = false;
    };
  }, [participanteId, ano]);

  useEffect(() => {
    let active = true;

    async function carregar() {
      if (!participanteId) {
        if (!active) return;
        setRegistrosSalariais([]);
        setSalarioMeta(normalizePaginated([], SALARY_PAGE_SIZE));
        return;
      }

      try {
        const data = normalizePaginated(
          await listarRegistrosSalariais(participanteId, {
            page: salarioPage,
            limit: SALARY_PAGE_SIZE,
          }),
          SALARY_PAGE_SIZE,
        );

        if (!active) return;
        setRegistrosSalariais(data.items);
        setSalarioMeta(data);
      } catch (error) {
        if (active) setStatus({ type: "error", message: error.message });
      }
    }

    carregar();
    return () => {
      active = false;
    };
  }, [participanteId, salarioPage]);

  useEffect(() => {
    let active = true;

    async function carregar() {
      if (!participanteId) {
        if (!active) return;
        setFerias([]);
        setFeriasMeta(normalizePaginated([], VACATION_PAGE_SIZE));
        setFeriasSummary(feriasSummaryInicial);
        return;
      }

      try {
        const payload = await listarFerias(participanteId, {
          page: feriasPage,
          limit: VACATION_PAGE_SIZE,
        });
        const data = normalizePaginated(payload, VACATION_PAGE_SIZE);

        if (!active) return;
        setFerias(data.items);
        setFeriasMeta(data);
        setFeriasSummary(payload?.summary || feriasSummaryInicial);
      } catch (error) {
        if (active) setStatus({ type: "error", message: error.message });
      }
    }

    carregar();
    return () => {
      active = false;
    };
  }, [participanteId, feriasPage]);

  useEffect(() => {
    let active = true;

    async function carregar() {
      try {
        const data = await buscarRelatorioMensal({ ano, mes: mesRelatorio });
        if (active) setRelatorio(data);
      } catch {
        if (active) setRelatorio(null);
      }
    }

    carregar();
    return () => {
      active = false;
    };
  }, [ano, mesRelatorio]);

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

  const entidadesFiltradasFolha = useMemo(() => {
    return entidadesFolha;
  }, [entidadesFolha]);

  const linhaDescontos = useMemo(
    () => linhas.find((linha) => linha.mes === mesDescontos),
    [linhas, mesDescontos],
  );

  async function carregarRelatorio() {
    try {
      const data = await buscarRelatorioMensal({ ano, mes: mesRelatorio });
      setRelatorio(data);
    } catch {
      setRelatorio(null);
    }
  }

  async function recarregarParticipantes() {
    const data = normalizePaginated(
      await listarParticipantes({
        termo,
        page: participantePage,
        limit: PARTICIPANTS_PAGE_SIZE,
      }),
      PARTICIPANTS_PAGE_SIZE,
    );
    const proximoId = data.items.some(
      (participante) => participante.id_entidade === participanteId,
    )
      ? participanteId
      : data.items[0]?.id_entidade || null;

    setParticipantes(data.items);
    setParticipantesMeta(data);
    if (proximoId !== participanteId) {
      limparEdicaoSalario();
      limparEdicaoFerias();
    }
    setParticipanteId(proximoId);

    if (!proximoId) {
      setDetalhe(null);
      setLinhas(meses.map((mes) => criarLinhaBase(mes.valor)));
      setAlterado(false);
      limparEdicaoSalario();
      limparEdicaoFerias();
    }
  }

  async function recarregarDetalheELancamentos() {
    if (!participanteId) return;

    const [participante, lancamentos] = await Promise.all([
      buscarParticipante(participanteId),
      listarLancamentosMensais(participanteId, ano),
    ]);
    const porMes = new Map(
      lancamentos.map((linha) => [Number(linha.mes), linha]),
    );

    setDetalhe(participante);
    setLinhas(
      meses.map((mes) => normalizarLinha(porMes.get(mes.valor), mes.valor)),
    );
    setAlterado(false);
  }

  async function recarregarSalarios() {
    if (!participanteId) return;

    const registros = normalizePaginated(
      await listarRegistrosSalariais(participanteId, {
        page: 1,
        limit: SALARY_PAGE_SIZE,
      }),
      SALARY_PAGE_SIZE,
    );

    setSalarioPage(1);
    setRegistrosSalariais(registros.items);
    setSalarioMeta(registros);
  }

  async function recarregarFerias() {
    if (!participanteId) return;

    const payload = await listarFerias(participanteId, {
      page: 1,
      limit: VACATION_PAGE_SIZE,
    });
    const data = normalizePaginated(payload, VACATION_PAGE_SIZE);

    setFeriasPage(1);
    setFerias(data.items);
    setFeriasMeta(data);
    setFeriasSummary(payload?.summary || feriasSummaryInicial);
  }

  async function recarregarAposAlteracaoSalarial() {
    await recarregarDetalheELancamentos();
    await recarregarSalarios();
    await recarregarFerias();
    await recarregarParticipantes();
    await carregarRelatorio();
  }

  function limparEdicaoSalario() {
    setSalarioForm(salarioInicial);
    setSalarioEditandoId(null);
    setImpactoSalarial(null);
  }

  function montarPayloadSalario() {
    return {
      inicio_vigencia: salarioForm.inicio_vigencia,
      fim_vigencia: salarioForm.fim_vigencia || null,
      salario: salarioForm.salario,
      percentual: salarioForm.percentual || null,
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
    setStatus({
      type: "success",
      message: estavaEditando
        ? "Registro salarial atualizado."
        : "Registro salarial criado.",
    });
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
    setStatus({ type: "success", message: "Registro salarial excluido." });
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
  }

  async function excluirSalario(registro) {
    if (!participanteId) return;

    setStatus(null);
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
      setStatus({ type: "error", message: error.message });
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
      setStatus({ type: "error", message: error.message });
    } finally {
      setProcessandoImpacto(false);
    }
  }

  function limparEdicaoFerias() {
    setFeriasForm(feriasInicial);
    setFeriasEditandoId(null);
  }

  function editarFerias(item) {
    setFeriasEditandoId(item.id_ferias);
    setFeriasForm({
      inicio_gozado: item.inicio_gozado || "",
      fim_gozado: item.fim_gozado || "",
      valor_abono: numero(item.valor_abono) > 0 ? String(item.valor_abono) : "",
    });
    setStatus(null);
  }

  async function excluirFerias(item) {
    if (!participanteId) return;
    if (
      !window.confirm(
        "Excluir este registro de ferias? Esta acao entra na auditoria.",
      )
    ) {
      return;
    }

    setStatus(null);
    try {
      await removerFerias(participanteId, item.id_ferias);
      if (feriasEditandoId === item.id_ferias) {
        limparEdicaoFerias();
      }
      await recarregarDetalheELancamentos();
      await recarregarFerias();
      await carregarRelatorio();
      setStatus({ type: "success", message: "Ferias excluidas." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
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
      setStatus({ type: "error", message: error.message });
    } finally {
      setCarregandoEntidadesFolha(false);
    }
  }

  async function abrirParticipantes() {
    setModalAberto("participantes");
    setEntidadesFolhaPage(1);
    await carregarEntidadesFolha(1);
  }

  async function alternarParticipacao(entidade) {
    const id = entidade.id_entidade;
    const participa = !entidade.participa_folha;

    setSalvandoParticipante(id);
    setStatus(null);

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
    } catch (error) {
      setStatus({ type: "error", message: error.message });
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
      setStatus({ type: "success", message: "Lançamentos salvos." });
      await carregarRelatorio();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
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
      setStatus({ type: "error", message: error.message });
    } finally {
      setExportando(false);
    }
  }

  async function adicionarSalario(event) {
    event.preventDefault();
    if (!participanteId) return;

    setStatus(null);
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
      setStatus({ type: "error", message: error.message });
    }
  }

  async function calcularPercentualSalario() {
    if (
      !participanteId ||
      !salarioForm.inicio_vigencia ||
      !salarioForm.salario
    ) {
      setStatus({
        type: "warning",
        message: "Informe data e salário para calcular o percentual.",
      });
      return;
    }

    setStatus(null);

    try {
      const sugestao = await buscarPercentualSugerido(participanteId, {
        inicio_vigencia: salarioForm.inicio_vigencia,
        salario: salarioForm.salario,
      });

      if (sugestao.percentual_sugerido === null) {
        setStatus({
          type: "warning",
          message: "Não existe salário anterior para sugerir o percentual.",
        });
        return;
      }

      setSalarioForm((form) => ({
        ...form,
        percentual: String(sugestao.percentual_sugerido),
      }));
      setStatus({
        type: "success",
        message: `Percentual sugerido com base em ${dinheiro(sugestao.salario_base)}.`,
      });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  async function adicionarFerias(event) {
    event.preventDefault();
    if (!participanteId) return;

    setStatus(null);
    try {
      const payload = {
        inicio_gozado: feriasForm.inicio_gozado,
        fim_gozado: feriasForm.fim_gozado,
        valor_abono: feriasForm.valor_abono || null,
      };

      if (feriasEditandoId) {
        await atualizarFerias(participanteId, feriasEditandoId, payload);
      } else {
        await criarFerias(participanteId, payload);
      }

      const estavaEditando = Boolean(feriasEditandoId);
      limparEdicaoFerias();
      await recarregarDetalheELancamentos();
      await recarregarFerias();
      await carregarRelatorio();
      setStatus({
        type: "success",
        message: estavaEditando ? "Ferias atualizadas." : "Ferias cadastradas.",
      });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  async function exportarRelatorio() {
    setStatus(null);
    try {
      await exportarRelatorioMensal({ ano, mes: mesRelatorio });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  function imprimirRelatorio() {
    if (!relatorio?.itens?.length) {
      return;
    }

    setStatus(null);
    try {
      window.print();
    } catch (error) {
      setStatus({
        type: "error",
        message: error?.message || "Falha ao abrir impressão.",
      });
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
          Relatório mensal
        </Button>
        <Button
          onClick={() => setAba("lancamentos")}
          type="button"
          variant={aba === "lancamentos" ? "default" : "outline"}
        >
          Lançamentos
        </Button>
      </div>

      {aba === "relatorio" ? (
        <section className="grid gap-4 print:block">
          <Card className="no-print border-emerald-100">
            <CardContent className="grid gap-3 pt-5 sm:grid-cols-[120px_180px_auto_auto] sm:items-end">
              <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                Ano
                <Input
                  max="2100"
                  min="2000"
                  onChange={(event) => setAno(Number(event.target.value))}
                  type="number"
                  value={ano}
                />
              </label>
              <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                Mês
                <select
                  className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  onChange={(event) =>
                    setMesRelatorio(Number(event.target.value))
                  }
                  value={mesRelatorio}
                >
                  {meses.map((mes) => (
                    <option key={mes.valor} value={mes.valor}>
                      {mes.label}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                disabled={!relatorio?.itens?.length}
                onClick={imprimirRelatorio}
                type="button"
                variant="secondary"
              >
                Imprimir relatório
              </Button>
              <Button
                disabled={!relatorio?.itens?.length}
                onClick={exportarRelatorio}
                type="button"
              >
                Exportar planilha
              </Button>
            </CardContent>
          </Card>

          <section className="printable-report rounded-lg border border-emerald-100 bg-white p-4 shadow-sm print:shadow-none">
            <ReportHeader
              emittedAt={formatDateTimeBR(new Date())}
              subtitle="Relatório mensal"
              title={`${relatorio?.nome_mes || meses[mesRelatorio - 1]?.label} / ${ano}`}
            />
            <div className="hidden">
              <span>Relatório mensal</span>
              <h2>
                {relatorio?.nome_mes || meses[mesRelatorio - 1]?.label} / {ano}
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid min-h-20 gap-1 rounded-lg border border-emerald-100 bg-white p-3">
                <span className="text-xs font-black uppercase text-slate-500">
                  Lançamentos
                </span>
                <strong className="self-end text-xl text-slate-950">
                  {relatorio?.itens?.length || 0}
                </strong>
              </div>
              <div className="grid min-h-20 gap-1 rounded-lg border border-emerald-100 bg-white p-3">
                <span className="text-xs font-black uppercase text-slate-500">
                  Total final + férias
                </span>
                <strong className="self-end text-xl text-slate-950">
                  {dinheiro(relatorio?.total)}
                </strong>
              </div>
            </div>
            <div className="overflow-auto rounded-md border border-emerald-100">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-slate-600">
                      Participante
                    </th>
                    <th className="bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-slate-600">
                      Bruto
                    </th>
                    <th className="bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-slate-600">
                      Proporcional
                    </th>
                    <th className="bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-slate-600">
                      Líquido
                    </th>
                    <th className="bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-slate-600">
                      Final
                    </th>
                    <th className="bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-slate-600">
                      Final + Férias
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(relatorio?.itens || []).map((item) => (
                    <tr key={item.id_folha_mensal}>
                      <td className="border-t border-emerald-50 px-3 py-2">
                        {item.entidade?.nome}
                      </td>
                      <td className="border-t border-emerald-50 px-3 py-2">
                        {dinheiro(item.salario_bruto)}
                      </td>
                      <td className="border-t border-emerald-50 px-3 py-2">
                        {dinheiro(item.salario_proporcional)}
                      </td>
                      <td className="border-t border-emerald-50 px-3 py-2">
                        {dinheiro(item.salario_liquido)}
                      </td>
                      <td className="border-t border-emerald-50 px-3 py-2">
                        {dinheiro(item.salario_liquido_com_desconto)}
                      </td>
                      <td className="border-t border-emerald-50 px-3 py-2">
                        {dinheiro(item.salario_final_com_ferias)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td
                      className="border-t border-emerald-100 bg-emerald-50 px-3 py-2"
                      colSpan="5"
                    >
                      <strong>Total final + férias</strong>
                    </td>
                    <td className="border-t border-emerald-100 bg-emerald-50 px-3 py-2">
                      <strong>{dinheiro(relatorio?.total)}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
              {!relatorio?.itens?.length ? (
                <p className="m-0 p-4 text-sm font-semibold text-slate-500">
                  Nenhum lançamento no período.
                </p>
              ) : null}
            </div>
            <PayrollMonthlyChart relatorio={relatorio} />
          </section>
        </section>
      ) : (
        <section className="grid w-full min-w-0 max-w-full items-start gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
          <Card className="min-w-0 border-emerald-100">
            <CardHeader className="flex-row items-center justify-between gap-3">
              <CardTitle>Participantes</CardTitle>
              <Badge>{participantesMeta.total}</Badge>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-col gap-3">
              <Button onClick={abrirParticipantes} type="button">
                Gerenciar participantes
              </Button>
              <Input
                onChange={(event) => {
                  setParticipantePage(1);
                  setTermo(event.target.value);
                }}
                placeholder="Buscar participante"
                type="search"
                value={termo}
              />
              <div className="grid gap-2">
                {participantes.map((participante) => (
                  <button
                    className={`grid min-h-20 w-full gap-1 rounded-lg border bg-white px-4 py-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50/40 ${
                      participante.id_entidade === participanteId
                        ? "border-emerald-700 bg-emerald-50"
                        : "border-emerald-100"
                    }`}
                    key={participante.id_entidade}
                    onClick={() => {
                      limparEdicaoSalario();
                      limparEdicaoFerias();
                      setParticipanteId(participante.id_entidade);
                      setSalarioPage(1);
                      setFeriasPage(1);
                    }}
                    type="button"
                  >
                    <strong className="truncate text-sm font-bold text-slate-950">
                      {participante.nome}
                    </strong>
                    <span className="truncate text-xs font-semibold text-slate-600">
                      {participante.cpf_cnpj}
                    </span>
                    <small className="truncate text-xs font-bold text-emerald-900">
                      {dinheiro(participante.salario_atual)}
                    </small>
                  </button>
                ))}
                {!participantes.length ? (
                  <p className="rounded-lg border border-dashed border-emerald-100 p-4 text-sm font-semibold text-slate-500">
                    Nenhum participante encontrado.
                  </p>
                ) : null}
              </div>
              <div className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2">
                <Button
                  disabled={participantePage <= 1}
                  onClick={() => setParticipantePage((current) => current - 1)}
                  type="button"
                  variant="secondary"
                >
                  Anterior
                </Button>
                <span className="whitespace-nowrap text-center text-xs font-black text-slate-600">
                  Página {participantesMeta.page} de{" "}
                  {participantesMeta.totalPages}
                </span>
                <Button
                  disabled={participantePage >= participantesMeta.totalPages}
                  onClick={() => setParticipantePage((current) => current + 1)}
                  type="button"
                  variant="secondary"
                >
                  Próxima
                </Button>
              </div>
            </CardContent>
          </Card>

          <section className="grid min-w-0 max-w-full gap-5">
            <section className="grid min-w-0 max-w-full gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <div className="grid min-h-20 gap-1 rounded-lg border border-emerald-100 bg-white p-3">
                <span className="text-xs font-black uppercase text-slate-500">
                  Participante
                </span>
                <strong className="self-end break-words text-lg text-slate-950">
                  {detalhe?.nome || "-"}
                </strong>
              </div>
              <div className="grid min-h-20 gap-1 rounded-lg border border-emerald-100 bg-white p-3">
                <span className="text-xs font-black uppercase text-slate-500">
                  Salário atual
                </span>
                <strong className="self-end break-words text-lg text-slate-950">
                  {dinheiro(detalhe?.salario_atual)}
                </strong>
              </div>
              <div className="grid min-h-20 gap-1 rounded-lg border border-emerald-100 bg-white p-3">
                <span className="text-xs font-black uppercase text-slate-500">
                  Admissão
                </span>
                <strong className="self-end break-words text-lg text-slate-950">
                  {formatDateBR(detalhe?.data_admissao)}
                </strong>
              </div>
              <div className="grid min-h-20 gap-1 rounded-lg border border-emerald-100 bg-white p-3">
                <span className="text-xs font-black uppercase text-slate-500">
                  Total bruto
                </span>
                <strong className="self-end break-words text-lg text-slate-950">
                  {dinheiro(totais.bruto)}
                </strong>
              </div>
              <div className="grid min-h-20 gap-1 rounded-lg border border-emerald-100 bg-white p-3">
                <span className="text-xs font-black uppercase text-slate-500">
                  Total final
                </span>
                <strong className="self-end break-words text-lg text-slate-950">
                  {dinheiro(totais.final)}
                </strong>
              </div>
              <div className="grid min-h-20 gap-1 rounded-lg border border-emerald-100 bg-white p-3">
                <span className="text-xs font-black uppercase text-slate-500">
                  Final + férias
                </span>
                <strong className="self-end break-words text-lg text-slate-950">
                  {dinheiro(totais.finalComFerias)}
                </strong>
              </div>
            </section>

            <Card className="min-w-0 max-w-full overflow-hidden border-emerald-100">
              <CardHeader className="min-w-0 flex-col items-start justify-between gap-3 lg:flex-row lg:items-end">
                <CardTitle>Lançamentos de {ano}</CardTitle>
                <div className="flex w-full min-w-0 flex-wrap items-end gap-2 sm:w-auto sm:justify-end">
                  <label className="grid w-28 gap-1.5 text-sm font-bold text-slate-700">
                    Ano
                    <Input
                      max="2100"
                      min="2000"
                      onChange={(event) => setAno(Number(event.target.value))}
                      type="number"
                      value={ano}
                    />
                  </label>
                  <Button
                    disabled={!participanteId || alterado || exportando}
                    onClick={exportar}
                    title={
                      alterado ? "Salve antes de exportar" : "Exportar planilha"
                    }
                    type="button"
                    variant="secondary"
                  >
                    {exportando ? "Exportando..." : "Exportar como planilha"}
                  </Button>
                  <Button
                    disabled={!participanteId || salvando || carregando}
                    onClick={salvar}
                    type="button"
                  >
                    {salvando ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="min-w-0 max-w-full">
                <Table
                  className="min-w-[1120px]"
                  wrapperClassName="max-w-full overflow-x-auto rounded-md border border-emerald-100"
                >
                  <TableHeader className="sticky top-0 z-10 bg-emerald-50">
                    <TableRow className="hover:bg-transparent">
                      {[
                        "Mês",
                        "Dias",
                        "Bruto",
                        "Proporcional",
                        "INSS",
                        "IRRF",
                        "INSS adic.",
                        "Comissão",
                        "Líquido",
                        "Descontos",
                        "Final",
                        "Final + Férias",
                      ].map((heading) => (
                        <TableHead
                          className="bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-slate-600"
                          key={heading}
                        >
                          {heading}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linhas.map((linha) => (
                      <TableRow key={linha.mes}>
                        <TableCell className="px-3 py-2 font-semibold">
                          {meses[Number(linha.mes) - 1]?.label}
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          <Input
                            className="h-9 w-20 px-2"
                            max="31"
                            min="0"
                            onChange={(event) =>
                              alterarLinha(
                                linha.mes,
                                "dias_trabalhados",
                                event.target.value,
                              )
                            }
                            type="number"
                            value={linha.dias_trabalhados}
                          />
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          {dinheiro(linha.salario_bruto)}
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          {dinheiro(linha.salario_proporcional)}
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          <MoneyInput
                            onChange={(value) =>
                              alterarLinha(linha.mes, "inss", value)
                            }
                            value={linha.inss}
                          />
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          <MoneyInput
                            onChange={(value) =>
                              alterarLinha(linha.mes, "irrf", value)
                            }
                            value={linha.irrf}
                          />
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          <MoneyInput
                            onChange={(value) =>
                              alterarLinha(linha.mes, "inss_adicional", value)
                            }
                            value={linha.inss_adicional}
                          />
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          <MoneyInput
                            onChange={(value) =>
                              alterarLinha(linha.mes, "comissao", value)
                            }
                            value={linha.comissao}
                          />
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          {dinheiro(linha.salario_liquido)}
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          <div className="flex min-w-36 items-center gap-2">
                            <span className="whitespace-nowrap font-semibold">
                              {dinheiro(totalDescontos(linha))}
                            </span>
                            <Button
                              onClick={() => abrirDescontos(linha.mes)}
                              size="sm"
                              type="button"
                              variant="secondary"
                            >
                              Editar
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          {dinheiro(linha.salario_liquido_com_desconto)}
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          {dinheiro(linha.salario_final_com_ferias)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <section className="grid gap-5 lg:grid-cols-2">
              <Card className="border-emerald-100">
                <CardHeader className="flex-row items-center justify-between gap-3">
                  <CardTitle>Registros salariais</CardTitle>
                  <Badge>{salarioMeta.total}</Badge>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <Button
                    className="w-full"
                    disabled={!participanteId}
                    onClick={() => setModalAberto("salarios")}
                    type="button"
                    variant="secondary"
                  >
                    Gerenciar salários
                  </Button>
                  <div className="grid gap-2">
                    {registrosSalariais.slice(0, 5).map((registro) => (
                      <div
                        className="grid gap-1 rounded-lg border border-emerald-100 bg-white p-3"
                        key={registro.id_registro_salarial}
                      >
                        <strong className="text-sm text-slate-950">
                          {dinheiro(registro.salario)}
                        </strong>
                        <span className="text-xs font-semibold text-slate-600">
                          {formatDateBR(registro.inicio_vigencia)} a{" "}
                          {registro.fim_vigencia
                            ? formatDateBR(registro.fim_vigencia)
                            : "Atual"}
                        </span>
                      </div>
                    ))}
                    {!registrosSalariais.length ? (
                      <p className="rounded-lg border border-dashed border-emerald-100 p-4 text-sm font-semibold text-slate-500">
                        Nenhum registro salarial.
                      </p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-100">
                <CardHeader className="flex-row items-center justify-between gap-3">
                  <CardTitle>Férias</CardTitle>
                  <Badge>{feriasMeta.total}</Badge>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <Button
                    className="w-full"
                    disabled={!participanteId}
                    onClick={() => setModalAberto("ferias")}
                    type="button"
                    variant="secondary"
                  >
                    Gerenciar férias
                  </Button>
                  <div className="grid gap-2">
                    {ferias.slice(0, 5).map((item) => (
                      <div
                        className="grid gap-1 rounded-lg border border-emerald-100 bg-white p-3"
                        key={item.id_ferias}
                      >
                        <strong className="text-sm text-slate-950">
                          {item.dias_gozados} dias
                        </strong>
                        <span className="text-xs font-semibold text-slate-600">
                          {formatDateBR(item.inicio_gozado)} a{" "}
                          {formatDateBR(item.fim_gozado)} -{" "}
                          {dinheiro(item.valor_total_ferias)}
                        </span>
                      </div>
                    ))}
                    {!ferias.length ? (
                      <p className="rounded-lg border border-dashed border-emerald-100 p-4 text-sm font-semibold text-slate-500">
                        Nenhum registro de férias.
                      </p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </section>
          </section>
        </section>
      )}

      {modalAberto === "participantes" ? (
        <Modal
          onClose={() => setModalAberto(null)}
          title="Gerenciar participantes da folha"
          width="lg"
        >
          <div className="grid gap-4">
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <Input
                onChange={(event) => setTermoEntidadesFolha(event.target.value)}
                placeholder="Buscar pessoa/empresa"
                type="search"
                value={termoEntidadesFolha}
              />
              <Button
                disabled={carregandoEntidadesFolha}
                onClick={() => carregarEntidadesFolha(1)}
                type="button"
                variant="secondary"
              >
                Buscar
              </Button>
            </div>
            <div className="grid gap-2">
              {entidadesFiltradasFolha.map((entidade) => (
                <button
                  className="flex min-h-16 w-full items-center justify-between gap-3 rounded-lg border border-emerald-100 bg-white px-4 py-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50/50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={salvandoParticipante === entidade.id_entidade}
                  key={entidade.id_entidade}
                  onClick={() => alternarParticipacao(entidade)}
                  type="button"
                >
                  <span className="grid min-w-0 gap-1">
                    <strong className="truncate text-sm text-slate-950">
                      {entidade.nome}
                    </strong>
                    <small className="truncate text-xs font-semibold text-slate-500">
                      {entidade.cpf_cnpj || "Sem documento"}
                    </small>
                  </span>
                  <Badge
                    className="shrink-0"
                    variant={entidade.participa_folha ? "default" : "secondary"}
                  >
                    {entidade.participa_folha ? "Na folha" : "Fora da folha"}
                  </Badge>
                </button>
              ))}
              {!entidadesFiltradasFolha.length ? (
                <p className="rounded-lg border border-dashed border-emerald-100 p-4 text-sm font-semibold text-slate-500">
                  {carregandoEntidadesFolha
                    ? "Carregando cadastros..."
                    : "Nenhum cadastro encontrado."}
                </p>
              ) : null}
            </div>
            <div className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-emerald-100 pt-3">
              <Button
                disabled={carregandoEntidadesFolha || entidadesFolhaPage <= 1}
                onClick={() => carregarEntidadesFolha(entidadesFolhaPage - 1)}
                type="button"
                variant="secondary"
              >
                Anterior
              </Button>
              <span className="whitespace-nowrap text-center text-xs font-black text-slate-600">
                Página {entidadesFolhaMeta.page} de{" "}
                {entidadesFolhaMeta.totalPages}
              </span>
              <Button
                disabled={
                  carregandoEntidadesFolha ||
                  entidadesFolhaPage >= entidadesFolhaMeta.totalPages
                }
                onClick={() => carregarEntidadesFolha(entidadesFolhaPage + 1)}
                type="button"
                variant="secondary"
              >
                Próxima
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}

      {modalAberto === "descontos" && linhaDescontos ? (
        <Modal
          onClose={() => setModalAberto(null)}
          title={`Descontos de ${meses[Number(linhaDescontos.mes) - 1]?.label}`}
        >
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {descontoCampos.map((item) => (
                <label
                  className="grid gap-1.5 text-sm font-bold text-slate-700"
                  key={item.campo}
                >
                  {item.label}
                  <MoneyInput
                    className="w-full"
                    onChange={(value) =>
                      alterarLinha(linhaDescontos.mes, item.campo, value)
                    }
                    value={linhaDescontos[item.campo]}
                  />
                </label>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
              <span className="text-sm font-bold text-slate-600">
                Total de descontos
              </span>
              <strong className="text-lg text-slate-950">
                {dinheiro(totalDescontos(linhaDescontos))}
              </strong>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setModalAberto(null)} type="button">
                Aplicar
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}

      {modalAberto === "salarios" ? (
        <Modal
          contentClassName="flex min-h-0 flex-col overflow-y-auto lg:overflow-hidden"
          onClose={() => setModalAberto(null)}
          title="Registros salariais"
          width="xl"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <form
              className="grid shrink-0 gap-4 rounded-lg border border-emerald-100 bg-emerald-50/40 p-4 md:grid-cols-2 lg:grid-cols-12"
              onSubmit={adicionarSalario}
            >
              <label className="grid gap-1.5 text-sm font-bold text-slate-700 lg:col-span-3">
                Início
                <Input
                  onChange={(event) =>
                    setSalarioForm((form) => ({
                      ...form,
                      inicio_vigencia: event.target.value,
                    }))
                  }
                  required
                  type="date"
                  value={salarioForm.inicio_vigencia}
                />
              </label>
              <label className="grid gap-1.5 text-sm font-bold text-slate-700 lg:col-span-3">
                Fim opcional
                <Input
                  onChange={(event) =>
                    setSalarioForm((form) => ({
                      ...form,
                      fim_vigencia: event.target.value,
                    }))
                  }
                  type="date"
                  value={salarioForm.fim_vigencia}
                />
              </label>
              <label className="grid gap-1.5 text-sm font-bold text-slate-700 lg:col-span-3">
                Salário
                <Input
                  min="0"
                  onChange={(event) =>
                    setSalarioForm((form) => ({
                      ...form,
                      salario: event.target.value,
                    }))
                  }
                  required
                  step="0.01"
                  type="number"
                  value={salarioForm.salario}
                />
              </label>
              <label className="grid gap-1.5 text-sm font-bold text-slate-700 lg:col-span-3">
                Percentual
                <span className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <Input
                    min="0"
                    onChange={(event) =>
                      setSalarioForm((form) => ({
                        ...form,
                        percentual: event.target.value,
                      }))
                    }
                    step="0.01"
                    type="number"
                    value={salarioForm.percentual}
                  />
                  <Button
                    onClick={calcularPercentualSalario}
                    type="button"
                    variant="secondary"
                  >
                    Calcular
                  </Button>
                </span>
              </label>
              <label className="grid gap-1.5 text-sm font-bold text-slate-700 md:col-span-2 lg:col-span-12">
                Observação
                <Input
                  onChange={(event) =>
                    setSalarioForm((form) => ({
                      ...form,
                      observacao: event.target.value,
                    }))
                  }
                  value={salarioForm.observacao}
                />
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end md:col-span-2 lg:col-span-12">
                <Button className="sm:min-w-44" type="submit">
                  {salarioEditandoId ? "Salvar alterações" : "Adicionar"}
                </Button>
                {salarioEditandoId ? (
                  <Button
                    className="sm:min-w-32"
                    onClick={limparEdicaoSalario}
                    type="button"
                    variant="secondary"
                  >
                    Cancelar
                  </Button>
                ) : null}
              </div>
            </form>
            <div className="grid min-h-0 gap-2 lg:flex-1 lg:overflow-y-auto lg:pr-1">
              {registrosSalariais.map((registro) => (
                <div
                  className="flex flex-col gap-3 rounded-lg border border-emerald-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                  key={registro.id_registro_salarial}
                >
                  <span className="grid min-w-0 gap-1">
                    <strong className="text-sm text-slate-950">
                      {dinheiro(registro.salario)}
                    </strong>
                    <span className="text-xs font-semibold text-slate-600">
                      {formatDateBR(registro.inicio_vigencia)} a{" "}
                      {registro.fim_vigencia
                        ? formatDateBR(registro.fim_vigencia)
                        : "Atual"}
                      {registro.percentual ? ` - ${registro.percentual}%` : ""}
                    </span>
                  </span>
                  <span className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => editarSalario(registro)}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      Editar
                    </Button>
                    <Button
                      onClick={() => excluirSalario(registro)}
                      size="sm"
                      type="button"
                      variant="destructive"
                    >
                      Excluir
                    </Button>
                  </span>
                </div>
              ))}
              {!registrosSalariais.length ? (
                <p className="rounded-lg border border-dashed border-emerald-100 p-4 text-sm font-semibold text-slate-500">
                  Nenhum registro salarial.
                </p>
              ) : null}
            </div>
            <div className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-emerald-100 pt-3">
              <Button
                disabled={salarioPage <= 1}
                onClick={() => setSalarioPage((current) => current - 1)}
                type="button"
                variant="secondary"
              >
                Anterior
              </Button>
              <span className="whitespace-nowrap text-center text-xs font-black text-slate-600">
                Página {salarioMeta.page} de {salarioMeta.totalPages}
              </span>
              <Button
                disabled={salarioPage >= salarioMeta.totalPages}
                onClick={() => setSalarioPage((current) => current + 1)}
                type="button"
                variant="secondary"
              >
                Próxima
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}

      {impactoSalarial ? (
        <Modal
          onClose={() => {
            if (!processandoImpacto) setImpactoSalarial(null);
          }}
          title={impactoSalarial.titulo}
          width="lg"
        >
          <div className="grid gap-4">
            <p className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-slate-700">
              {impactoSalarial.mensagem}
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <section className="grid gap-2 rounded-lg border border-emerald-100 bg-white p-4">
                <h3 className="text-sm font-bold text-slate-950">
                  Férias afetadas
                </h3>
                {(impactoSalarial.impacto?.ferias || []).length ? (
                  <ul className="grid gap-2 text-sm text-slate-700">
                    {impactoSalarial.impacto.ferias.map((item) => (
                      <li
                        className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2"
                        key={`ferias-${item.id_ferias}`}
                      >
                        {item.descricao ||
                          `Férias de ${formatDateBR(item.inicio_gozado)} a ${formatDateBR(item.fim_gozado)}`}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-lg border border-dashed border-emerald-100 p-4 text-sm font-semibold text-slate-500">
                    Nenhum registro de férias afetado.
                  </p>
                )}
              </section>

              <section className="grid gap-2 rounded-lg border border-emerald-100 bg-white p-4">
                <h3 className="text-sm font-bold text-slate-950">
                  Folhas afetadas
                </h3>
                {(impactoSalarial.impacto?.lancamentos || []).length ? (
                  <ul className="grid gap-2 text-sm text-slate-700">
                    {impactoSalarial.impacto.lancamentos.map((item) => (
                      <li
                        className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2"
                        key={`folha-${item.ano}-${item.mes}`}
                      >
                        {item.descricao ||
                          `Folha de pagamento ${mesAno(item.ano, item.mes)}`}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-lg border border-dashed border-emerald-100 p-4 text-sm font-semibold text-slate-500">
                    Nenhuma folha afetada.
                  </p>
                )}
              </section>
            </div>

            {(impactoSalarial.impacto?.sem_salario || []).length ? (
              <section className="grid gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <h3 className="text-sm font-bold text-amber-900">
                  Sem salário vigente
                </h3>
                <p className="text-sm font-semibold text-amber-900">
                  Os trechos abaixo serao recalculados com valor 0 onde nao
                  houver salario vigente.
                </p>
                <ul className="grid gap-2 text-sm text-amber-950">
                  {impactoSalarial.impacto.sem_salario.map((item, index) => (
                    <li
                      className="rounded-md border border-amber-200 bg-white/70 px-3 py-2"
                      key={`${item.tipo}-${item.referencia || index}`}
                    >
                      {item.descricao}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                disabled={processandoImpacto}
                onClick={() => setImpactoSalarial(null)}
                type="button"
                variant="secondary"
              >
                Cancelar
              </Button>
              <Button
                disabled={processandoImpacto}
                onClick={confirmarImpactoSalarial}
                type="button"
              >
                {processandoImpacto ? "Confirmando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}

      {modalAberto === "ferias" ? (
        <Modal
          contentClassName="flex min-h-0 flex-col overflow-y-auto lg:overflow-hidden"
          onClose={() => setModalAberto(null)}
          title="Registro de férias"
          width="xl"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <form
              className="grid shrink-0 gap-4 rounded-lg border border-emerald-100 bg-emerald-50/40 p-4 md:grid-cols-3 lg:grid-cols-12"
              onSubmit={adicionarFerias}
            >
              <label className="grid gap-1.5 text-sm font-bold text-slate-700 lg:col-span-3">
                Início gozado
                <Input
                  onChange={(event) =>
                    setFeriasForm((form) => ({
                      ...form,
                      inicio_gozado: event.target.value,
                    }))
                  }
                  required
                  type="date"
                  value={feriasForm.inicio_gozado}
                />
              </label>
              <label className="grid gap-1.5 text-sm font-bold text-slate-700 lg:col-span-3">
                Fim gozado
                <Input
                  onChange={(event) =>
                    setFeriasForm((form) => ({
                      ...form,
                      fim_gozado: event.target.value,
                    }))
                  }
                  required
                  type="date"
                  value={feriasForm.fim_gozado}
                />
              </label>
              <label className="grid gap-1.5 text-sm font-bold text-slate-700 lg:col-span-3">
                Abono opcional
                <Input
                  min="0"
                  onChange={(event) =>
                    setFeriasForm((form) => ({
                      ...form,
                      valor_abono: event.target.value,
                    }))
                  }
                  step="0.01"
                  type="number"
                  value={feriasForm.valor_abono}
                />
              </label>
              <div className="flex flex-col gap-2 md:col-span-3 sm:flex-row sm:justify-end lg:col-span-3 lg:items-end">
                <Button className="sm:min-w-44" type="submit">
                  {feriasEditandoId ? "Salvar alterações" : "Adicionar"}
                </Button>
                {feriasEditandoId ? (
                  <Button
                    className="sm:min-w-32"
                    onClick={limparEdicaoFerias}
                    type="button"
                    variant="secondary"
                  >
                    Cancelar
                  </Button>
                ) : null}
              </div>
            </form>
            <div className="grid shrink-0 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="grid min-h-20 gap-1 rounded-lg border border-emerald-100 bg-white p-3">
                <span className="text-xs font-black uppercase text-slate-500">
                  Período aquisitivo
                </span>
                <strong className="self-end text-sm text-slate-950">
                  {feriasSummary.periodo_aquisitivo_inicio
                    ? `${formatDateBR(feriasSummary.periodo_aquisitivo_inicio)} a ${formatDateBR(feriasSummary.periodo_aquisitivo_fim)}`
                    : "-"}
                </strong>
              </div>
              <div className="grid min-h-20 gap-1 rounded-lg border border-emerald-100 bg-white p-3">
                <span className="text-xs font-black uppercase text-slate-500">
                  Anos aquisitivos
                </span>
                <strong className="self-end text-lg text-slate-950">
                  {feriasSummary.anos_aquisitivos || 0}
                </strong>
              </div>
              <div className="grid min-h-20 gap-1 rounded-lg border border-emerald-100 bg-white p-3">
                <span className="text-xs font-black uppercase text-slate-500">
                  Dias adquiridos
                </span>
                <strong className="self-end text-lg text-slate-950">
                  {feriasSummary.dias_adquiridos || 0} dias
                </strong>
              </div>
              <div className="grid min-h-20 gap-1 rounded-lg border border-emerald-100 bg-white p-3">
                <span className="text-xs font-black uppercase text-slate-500">
                  Dias gozados
                </span>
                <strong className="self-end text-lg text-slate-950">
                  {feriasSummary.total_dias_gozados || 0} dias
                </strong>
              </div>
              <div className="grid min-h-20 gap-1 rounded-lg border border-emerald-100 bg-white p-3">
                <span className="text-xs font-black uppercase text-slate-500">
                  Saldo
                </span>
                <strong className="self-end text-lg text-slate-950">
                  {feriasSummary.saldo_ferias_dias || 0} dias
                </strong>
              </div>
            </div>
            <div className="min-h-0 lg:flex-1">
              <Table
                className="min-w-[760px]"
                wrapperClassName="max-h-[44vh] rounded-md border border-emerald-100 lg:h-full"
              >
                <TableHeader className="sticky top-0 z-10 bg-emerald-50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-slate-600">
                      Início gozado
                    </TableHead>
                    <TableHead className="bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-slate-600">
                      Fim gozado
                    </TableHead>
                    <TableHead className="bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-slate-600">
                      Dias
                    </TableHead>
                    <TableHead className="bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-slate-600">
                      Valor calculado
                    </TableHead>
                    <TableHead className="bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-slate-600">
                      Abono
                    </TableHead>
                    <TableHead className="bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-slate-600">
                      Total
                    </TableHead>
                    <TableHead className="bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-slate-600">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ferias.map((item) => (
                    <TableRow key={item.id_ferias}>
                      <TableCell className="px-3 py-2">
                        {formatDateBR(item.inicio_gozado)}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        {formatDateBR(item.fim_gozado)}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        {item.dias_gozados} dias
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        {dinheiro(item.valor_ferias)}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        {dinheiro(item.valor_abono)}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        {dinheiro(item.valor_total_ferias)}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <span className="flex flex-wrap gap-2">
                          <Button
                            onClick={() => editarFerias(item)}
                            size="sm"
                            type="button"
                            variant="secondary"
                          >
                            Editar
                          </Button>
                          <Button
                            onClick={() => excluirFerias(item)}
                            size="sm"
                            type="button"
                            variant="destructive"
                          >
                            Excluir
                          </Button>
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter className="sticky bottom-0 bg-emerald-50">
                  <TableRow className="hover:bg-emerald-50">
                    <TableCell className="px-3 py-2" colSpan="2">
                      <strong>Total de férias gozadas</strong>
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <strong>
                        {feriasSummary.total_dias_gozados || 0} dias
                      </strong>
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <strong>
                        {dinheiro(
                          ferias.reduce(
                            (total, item) => total + numero(item.valor_ferias),
                            0,
                          ),
                        )}
                      </strong>
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <strong>
                        {dinheiro(
                          ferias.reduce(
                            (total, item) => total + numero(item.valor_abono),
                            0,
                          ),
                        )}
                      </strong>
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <strong>
                        {dinheiro(
                          ferias.reduce(
                            (total, item) =>
                              total + numero(item.valor_total_ferias),
                            0,
                          ),
                        )}
                      </strong>
                    </TableCell>
                    <TableCell className="px-3 py-2"></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
              {!ferias.length ? (
                <p className="m-0 p-4 text-sm font-semibold text-slate-500">
                  Nenhum registro de férias.
                </p>
              ) : null}
            </div>
            <div className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-emerald-100 pt-3">
              <Button
                disabled={feriasPage <= 1}
                onClick={() => setFeriasPage((current) => current - 1)}
                type="button"
                variant="secondary"
              >
                Anterior
              </Button>
              <span className="whitespace-nowrap text-center text-xs font-black text-slate-600">
                Página {feriasMeta.page} de {feriasMeta.totalPages}
              </span>
              <Button
                disabled={feriasPage >= feriasMeta.totalPages}
                onClick={() => setFeriasPage((current) => current + 1)}
                type="button"
                variant="secondary"
              >
                Próxima
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </main>
  );
}

export default FolhaPage;
