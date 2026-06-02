import { useEffect, useMemo, useState } from "react";
import {
  atualizarEntidade,
  listarEntidades,
} from "../entidades/entidades.service";
import Modal from "../../shared/components/Modal";
import StatusMessage from "../../shared/components/StatusMessage";
import { normalizePaginated } from "../../shared/services/api";
import PayrollMonthlyChart from "./PayrollMonthlyChart";
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
} from "./folha.service";

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

const camposEditaveis = [
  "dias_trabalhados",
  "inss",
  "irrf",
  "inss_adicional",
  "comissao",
  "desconto_bar",
  "desconto_diverso_1",
  "desconto_diverso_2",
  "desconto_diverso_3",
];

const descontoCampos = [
  { campo: "desconto_bar", label: "Bar" },
  { campo: "desconto_diverso_1", label: "Desconto diverso 1" },
  { campo: "desconto_diverso_2", label: "Desconto diverso 2" },
  { campo: "desconto_diverso_3", label: "Desconto diverso 3" },
];

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

function numero(value) {
  if (value === "" || value === null || value === undefined) return 0;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function dinheiro(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numero(value));
}

function mesAno(ano, mes) {
  return `${String(mes).padStart(2, "0")}/${ano}`;
}

function possuiImpactoSalarial(impacto) {
  return Boolean(
    impacto?.tem_impacto ||
    impacto?.ferias?.length ||
    impacto?.lancamentos?.length ||
    impacto?.sem_salario?.length,
  );
}

function totalDescontos(linha) {
  return descontoCampos.reduce(
    (total, item) => total + numero(linha[item.campo]),
    0,
  );
}

function calcularLinha(linha, recalcularProporcional = false) {
  const salarioProporcional =
    recalcularProporcional || linha.salario_proporcional === ""
      ? (numero(linha.salario_bruto) / 30) * numero(linha.dias_trabalhados)
      : numero(linha.salario_proporcional);
  const salarioLiquido =
    salarioProporcional +
    numero(linha.comissao) -
    numero(linha.inss) -
    numero(linha.irrf) -
    numero(linha.inss_adicional);

  const descontos = totalDescontos(linha);

  return {
    ...linha,
    salario_proporcional: salarioProporcional.toFixed(2),
    salario_liquido: salarioLiquido.toFixed(2),
    salario_liquido_com_desconto: (salarioLiquido - descontos).toFixed(2),
    salario_final_com_ferias: (
      salarioLiquido -
      descontos +
      numero(linha.ferias)
    ).toFixed(2),
  };
}

function criarLinhaBase(mes) {
  return calcularLinha({
    mes,
    dias_trabalhados: "",
    salario_bruto: "",
    salario_proporcional: "",
    inss: "",
    irrf: "",
    inss_adicional: "",
    ferias: "",
    ferias_automatica: false,
    comissao: "",
    desconto_bar: "",
    desconto_diverso_1: "",
    desconto_diverso_2: "",
    desconto_diverso_3: "",
    salario_liquido: "0.00",
    salario_liquido_com_desconto: "0.00",
    salario_final_com_ferias: "0.00",
  });
}

function normalizarLinha(registro, mes) {
  if (!registro) return criarLinhaBase(mes);

  return calcularLinha({
    ...criarLinhaBase(mes),
    ...Object.fromEntries(
      Object.entries(registro).map(([key, value]) => [
        key,
        key === "ferias_automatica"
          ? Boolean(value)
          : value === null || value === undefined
            ? ""
            : String(value),
      ]),
    ),
    mes,
  });
}

function montarPayload(linhas) {
  return linhas.map((linha) => {
    const payload = {
      mes: Number(linha.mes),
      dias_trabalhados: Number(linha.dias_trabalhados || 0),
    };

    camposEditaveis
      .filter((campo) => campo !== "dias_trabalhados")
      .forEach((campo) => {
        payload[campo] = numero(linha[campo]);
      });

    return payload;
  });
}

function MoneyInput({ disabled = false, value, onChange }) {
  return (
    <input
      className="cell-input"
      disabled={disabled}
      min="0"
      onChange={(event) => onChange(event.target.value)}
      step="0.01"
      type="number"
      value={value}
    />
  );
}

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
    <main className="workspace-page payroll-page">
      <section className="page-heading no-print">
        <button className="ghost-button" onClick={onBack} type="button">
          Voltar
        </button>
        <div>
          <span>Folha</span>
          <h1>Folha de Pagamento</h1>
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

      <div className="tabs no-print">
        <button
          className={aba === "relatorio" ? "active" : ""}
          onClick={() => setAba("relatorio")}
          type="button"
        >
          Relatório mensal
        </button>
        <button
          className={aba === "lancamentos" ? "active" : ""}
          onClick={() => setAba("lancamentos")}
          type="button"
        >
          Lançamentos
        </button>
      </div>

      {aba === "relatorio" ? (
        <section className="report-page print-area">
          <section className="panel report-toolbar no-print">
            <label>
              Ano
              <input
                max="2100"
                min="2000"
                onChange={(event) => setAno(Number(event.target.value))}
                type="number"
                value={ano}
              />
            </label>
            <label>
              Mês
              <select
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
            <button
              className="secondary-button"
              disabled={!relatorio?.itens?.length}
              onClick={imprimirRelatorio}
              type="button"
            >
              Imprimir relatório
            </button>
            <button
              className="primary-button"
              disabled={!relatorio?.itens?.length}
              onClick={exportarRelatorio}
              type="button"
            >
              Exportar planilha
            </button>
          </section>

          <section className="panel printable-report">
            <div className="report-title">
              <span>Relatório mensal</span>
              <h2>
                {relatorio?.nome_mes || meses[mesRelatorio - 1]?.label} / {ano}
              </h2>
            </div>
            <div className="summary-grid">
              <div>
                <span>Lançamentos</span>
                <strong>{relatorio?.itens?.length || 0}</strong>
              </div>
              <div>
                <span>Total final + férias</span>
                <strong>{dinheiro(relatorio?.total)}</strong>
              </div>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Participante</th>
                    <th>Bruto</th>
                    <th>Proporcional</th>
                    <th>Líquido</th>
                    <th>Final</th>
                    <th>Final + Férias</th>
                  </tr>
                </thead>
                <tbody>
                  {(relatorio?.itens || []).map((item) => (
                    <tr key={item.id_folha_mensal}>
                      <td>{item.entidade?.nome}</td>
                      <td>{dinheiro(item.salario_bruto)}</td>
                      <td>{dinheiro(item.salario_proporcional)}</td>
                      <td>{dinheiro(item.salario_liquido)}</td>
                      <td>{dinheiro(item.salario_liquido_com_desconto)}</td>
                      <td>{dinheiro(item.salario_final_com_ferias)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="5">
                      <strong>Total final + férias</strong>
                    </td>
                    <td>
                      <strong>{dinheiro(relatorio?.total)}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
              {!relatorio?.itens?.length ? (
                <p className="empty-state">Nenhum lançamento no período.</p>
              ) : null}
            </div>
            <PayrollMonthlyChart relatorio={relatorio} />
          </section>
        </section>
      ) : (
        <section className="payroll-layout">
          <aside className="panel list-panel">
            <div className="panel-heading">
              <h2>Participantes</h2>
              <span>{participantesMeta.total}</span>
            </div>
            <button
              className="primary-button full"
              onClick={abrirParticipantes}
              type="button"
            >
              Gerenciar participantes
            </button>
            <input
              onChange={(event) => {
                setParticipantePage(1);
                setTermo(event.target.value);
              }}
              placeholder="Buscar participante"
              type="search"
              value={termo}
            />
            <div className="record-list">
              {participantes.map((participante) => (
                <button
                  className={`record-row ${
                    participante.id_entidade === participanteId ? "active" : ""
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
                  <strong>{participante.nome}</strong>
                  <span>{participante.cpf_cnpj}</span>
                  <small>{dinheiro(participante.salario_atual)}</small>
                </button>
              ))}
              {!participantes.length ? (
                <p className="empty-state">Nenhum participante encontrado.</p>
              ) : null}
            </div>
            <div className="pagination-row">
              <button
                className="secondary-button"
                disabled={participantePage <= 1}
                onClick={() => setParticipantePage((current) => current - 1)}
                type="button"
              >
                Anterior
              </button>
              <span>
                Pagina {participantesMeta.page} de{" "}
                {participantesMeta.totalPages}
              </span>
              <button
                className="secondary-button"
                disabled={participantePage >= participantesMeta.totalPages}
                onClick={() => setParticipantePage((current) => current + 1)}
                type="button"
              >
                Proxima
              </button>
            </div>
          </aside>

          <section className="detail-stack">
            <section className="summary-grid">
              <div>
                <span>Participante</span>
                <strong>{detalhe?.nome || "-"}</strong>
              </div>
              <div>
                <span>Salário atual</span>
                <strong>{dinheiro(detalhe?.salario_atual)}</strong>
              </div>
              <div>
                <span>Admissão</span>
                <strong>{detalhe?.data_admissao || "-"}</strong>
              </div>
              <div>
                <span>Total bruto</span>
                <strong>{dinheiro(totais.bruto)}</strong>
              </div>
              <div>
                <span>Total final</span>
                <strong>{dinheiro(totais.final)}</strong>
              </div>
              <div>
                <span>Final + férias</span>
                <strong>{dinheiro(totais.finalComFerias)}</strong>
              </div>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <h2>Lançamentos de {ano}</h2>
                <div className="row-actions">
                  <label className="compact-field">
                    Ano
                    <input
                      max="2100"
                      min="2000"
                      onChange={(event) => setAno(Number(event.target.value))}
                      type="number"
                      value={ano}
                    />
                  </label>
                  <button
                    className="secondary-button"
                    disabled={!participanteId || alterado || exportando}
                    onClick={exportar}
                    title={
                      alterado ? "Salve antes de exportar" : "Exportar planilha"
                    }
                    type="button"
                  >
                    {exportando ? "Exportando..." : "Exportar como planilha"}
                  </button>
                  <button
                    className="primary-button"
                    disabled={!participanteId || salvando || carregando}
                    onClick={salvar}
                    type="button"
                  >
                    {salvando ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </div>
              <div className="table-scroll">
                <table className="payroll-table">
                  <thead>
                    <tr>
                      <th>Mês</th>
                      <th>Dias</th>
                      <th>Bruto</th>
                      <th>Proporcional</th>
                      <th>INSS</th>
                      <th>IRRF</th>
                      <th>INSS adic.</th>
                      <th>Comissão</th>
                      <th>Líquido</th>
                      <th>Descontos</th>
                      <th>Final</th>
                      <th>Final + Férias</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhas.map((linha) => (
                      <tr key={linha.mes}>
                        <td>{meses[Number(linha.mes) - 1]?.label}</td>
                        <td>
                          <input
                            className="cell-input small"
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
                        </td>
                        <td>{dinheiro(linha.salario_bruto)}</td>
                        <td>{dinheiro(linha.salario_proporcional)}</td>
                        <td>
                          <MoneyInput
                            onChange={(value) =>
                              alterarLinha(linha.mes, "inss", value)
                            }
                            value={linha.inss}
                          />
                        </td>
                        <td>
                          <MoneyInput
                            onChange={(value) =>
                              alterarLinha(linha.mes, "irrf", value)
                            }
                            value={linha.irrf}
                          />
                        </td>
                        <td>
                          <MoneyInput
                            onChange={(value) =>
                              alterarLinha(linha.mes, "inss_adicional", value)
                            }
                            value={linha.inss_adicional}
                          />
                        </td>
                        <td>
                          <MoneyInput
                            onChange={(value) =>
                              alterarLinha(linha.mes, "comissao", value)
                            }
                            value={linha.comissao}
                          />
                        </td>
                        <td>{dinheiro(linha.salario_liquido)}</td>
                        <td>
                          <div className="discount-cell">
                            <span>{dinheiro(totalDescontos(linha))}</span>
                            <button
                              className="secondary-button tiny-button"
                              onClick={() => abrirDescontos(linha.mes)}
                              type="button"
                            >
                              Editar
                            </button>
                          </div>
                        </td>
                        <td>{dinheiro(linha.salario_liquido_com_desconto)}</td>
                        <td>{dinheiro(linha.salario_final_com_ferias)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="lower-grid">
              <section className="panel">
                <div className="panel-heading">
                  <h2>Registros salariais</h2>
                  <span>{salarioMeta.total}</span>
                </div>
                <button
                  className="secondary-button full"
                  disabled={!participanteId}
                  onClick={() => setModalAberto("salarios")}
                  type="button"
                >
                  Gerenciar salários
                </button>
                <div className="mini-list">
                  {registrosSalariais.slice(0, 5).map((registro) => (
                    <div key={registro.id_registro_salarial}>
                      <strong>{dinheiro(registro.salario)}</strong>
                      <span>
                        {registro.inicio_vigencia} a{" "}
                        {registro.fim_vigencia || "Atual"}
                      </span>
                    </div>
                  ))}
                  {!registrosSalariais.length ? (
                    <p className="empty-state">Nenhum registro salarial.</p>
                  ) : null}
                </div>
              </section>

              <section className="panel">
                <div className="panel-heading">
                  <h2>Férias</h2>
                  <span>{feriasMeta.total}</span>
                </div>
                <button
                  className="secondary-button full"
                  disabled={!participanteId}
                  onClick={() => setModalAberto("ferias")}
                  type="button"
                >
                  Gerenciar férias
                </button>
                <div className="mini-list">
                  {ferias.slice(0, 5).map((item) => (
                    <div key={item.id_ferias}>
                      <strong>{item.dias_gozados} dias</strong>
                      <span>
                        {item.inicio_gozado} a {item.fim_gozado} -{" "}
                        {dinheiro(item.valor_total_ferias)}
                      </span>
                    </div>
                  ))}
                  {!ferias.length ? (
                    <p className="empty-state">Nenhum registro de férias.</p>
                  ) : null}
                </div>
              </section>
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
          <div className="modal-body">
            <div className="search-row">
              <input
                onChange={(event) => setTermoEntidadesFolha(event.target.value)}
                placeholder="Buscar pessoa/empresa"
                type="search"
                value={termoEntidadesFolha}
              />
              <button
                className="secondary-button"
                disabled={carregandoEntidadesFolha}
                onClick={() => carregarEntidadesFolha(1)}
                type="button"
              >
                Buscar
              </button>
            </div>
            <div className="toggle-list">
              {entidadesFiltradasFolha.map((entidade) => (
                <button
                  className="toggle-row"
                  disabled={salvandoParticipante === entidade.id_entidade}
                  key={entidade.id_entidade}
                  onClick={() => alternarParticipacao(entidade)}
                  type="button"
                >
                  <span>
                    <strong>{entidade.nome}</strong>
                    <small>{entidade.cpf_cnpj || "Sem documento"}</small>
                  </span>
                  <span
                    className={`toggle-pill ${
                      entidade.participa_folha ? "active" : ""
                    }`}
                  >
                    {entidade.participa_folha ? "Na folha" : "Fora da folha"}
                  </span>
                </button>
              ))}
              {!entidadesFiltradasFolha.length ? (
                <p className="empty-state">
                  {carregandoEntidadesFolha
                    ? "Carregando cadastros..."
                    : "Nenhum cadastro encontrado."}
                </p>
              ) : null}
            </div>
            <div className="pagination-row">
              <button
                className="secondary-button"
                disabled={carregandoEntidadesFolha || entidadesFolhaPage <= 1}
                onClick={() => carregarEntidadesFolha(entidadesFolhaPage - 1)}
                type="button"
              >
                Anterior
              </button>
              <span>
                Pagina {entidadesFolhaMeta.page} de{" "}
                {entidadesFolhaMeta.totalPages}
              </span>
              <button
                className="secondary-button"
                disabled={
                  carregandoEntidadesFolha ||
                  entidadesFolhaPage >= entidadesFolhaMeta.totalPages
                }
                onClick={() => carregarEntidadesFolha(entidadesFolhaPage + 1)}
                type="button"
              >
                Proxima
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {modalAberto === "descontos" && linhaDescontos ? (
        <Modal
          onClose={() => setModalAberto(null)}
          title={`Descontos de ${meses[Number(linhaDescontos.mes) - 1]?.label}`}
        >
          <div className="modal-body">
            <div className="form-grid one-column">
              {descontoCampos.map((item) => (
                <label key={item.campo}>
                  {item.label}
                  <MoneyInput
                    onChange={(value) =>
                      alterarLinha(linhaDescontos.mes, item.campo, value)
                    }
                    value={linhaDescontos[item.campo]}
                  />
                </label>
              ))}
            </div>
            <div className="modal-summary">
              <span>Total de descontos</span>
              <strong>{dinheiro(totalDescontos(linhaDescontos))}</strong>
            </div>
            <div className="form-actions">
              <button
                className="primary-button"
                onClick={() => setModalAberto(null)}
                type="button"
              >
                Aplicar
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {modalAberto === "salarios" ? (
        <Modal onClose={() => setModalAberto(null)} title="Registros salariais">
          <div className="modal-body">
            <form className="compact-form" onSubmit={adicionarSalario}>
              <label>
                Início
                <input
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
              <label>
                Fim opcional
                <input
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
              <label>
                Salário
                <input
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
              <label>
                Percentual
                <span className="input-with-button">
                  <input
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
                  <button
                    className="secondary-button"
                    onClick={calcularPercentualSalario}
                    type="button"
                  >
                    Calcular
                  </button>
                </span>
              </label>
              <label>
                Observação
                <input
                  onChange={(event) =>
                    setSalarioForm((form) => ({
                      ...form,
                      observacao: event.target.value,
                    }))
                  }
                  value={salarioForm.observacao}
                />
              </label>
              <button className="primary-button" type="submit">
                {salarioEditandoId ? "Salvar alteracoes" : "Adicionar"}
              </button>
              {salarioEditandoId ? (
                <button
                  className="secondary-button"
                  onClick={limparEdicaoSalario}
                  type="button"
                >
                  Cancelar
                </button>
              ) : null}
            </form>
            <div className="mini-list">
              {registrosSalariais.map((registro) => (
                <div key={registro.id_registro_salarial}>
                  <span className="mini-list-content">
                    <strong>{dinheiro(registro.salario)}</strong>
                    <span>
                      {registro.inicio_vigencia} a{" "}
                      {registro.fim_vigencia || "Atual"}
                      {registro.percentual ? ` - ${registro.percentual}%` : ""}
                    </span>
                  </span>
                  <span className="inline-actions">
                    <button
                      className="secondary-button tiny-button"
                      onClick={() => editarSalario(registro)}
                      type="button"
                    >
                      Editar
                    </button>
                    <button
                      className="secondary-button tiny-button danger-button"
                      onClick={() => excluirSalario(registro)}
                      type="button"
                    >
                      Excluir
                    </button>
                  </span>
                </div>
              ))}
              {!registrosSalariais.length ? (
                <p className="empty-state">Nenhum registro salarial.</p>
              ) : null}
            </div>
            <div className="pagination-row">
              <button
                className="secondary-button"
                disabled={salarioPage <= 1}
                onClick={() => setSalarioPage((current) => current - 1)}
                type="button"
              >
                Anterior
              </button>
              <span>
                Pagina {salarioMeta.page} de {salarioMeta.totalPages}
              </span>
              <button
                className="secondary-button"
                disabled={salarioPage >= salarioMeta.totalPages}
                onClick={() => setSalarioPage((current) => current + 1)}
                type="button"
              >
                Proxima
              </button>
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
          <div className="modal-body">
            <p className="impact-intro">{impactoSalarial.mensagem}</p>

            <div className="impact-grid">
              <section>
                <h3>Ferias afetadas</h3>
                {(impactoSalarial.impacto?.ferias || []).length ? (
                  <ul className="impact-list">
                    {impactoSalarial.impacto.ferias.map((item) => (
                      <li key={`ferias-${item.id_ferias}`}>
                        {item.descricao ||
                          `Ferias de ${item.inicio_gozado} a ${item.fim_gozado}`}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-state">Nenhuma feria afetada.</p>
                )}
              </section>

              <section>
                <h3>Folhas afetadas</h3>
                {(impactoSalarial.impacto?.lancamentos || []).length ? (
                  <ul className="impact-list">
                    {impactoSalarial.impacto.lancamentos.map((item) => (
                      <li key={`folha-${item.ano}-${item.mes}`}>
                        {item.descricao ||
                          `Folha de pagamento ${mesAno(item.ano, item.mes)}`}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-state">Nenhuma folha afetada.</p>
                )}
              </section>
            </div>

            {(impactoSalarial.impacto?.sem_salario || []).length ? (
              <section className="impact-warning">
                <h3>Sem salario vigente</h3>
                <p>
                  Os trechos abaixo serao recalculados com valor 0 onde nao
                  houver salario vigente.
                </p>
                <ul className="impact-list">
                  {impactoSalarial.impacto.sem_salario.map((item, index) => (
                    <li key={`${item.tipo}-${item.referencia || index}`}>
                      {item.descricao}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <div className="form-actions">
              <button
                className="secondary-button"
                disabled={processandoImpacto}
                onClick={() => setImpactoSalarial(null)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="primary-button"
                disabled={processandoImpacto}
                onClick={confirmarImpactoSalarial}
                type="button"
              >
                {processandoImpacto ? "Confirmando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {modalAberto === "ferias" ? (
        <Modal
          onClose={() => setModalAberto(null)}
          title="Registro de férias"
          width="lg"
        >
          <div className="modal-body">
            <form className="compact-form" onSubmit={adicionarFerias}>
              <label>
                Inicio gozado
                <input
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
              <label>
                Fim gozado
                <input
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
              <label>
                Abono opcional
                <input
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
              <button className="primary-button" type="submit">
                {feriasEditandoId ? "Salvar alteracoes" : "Adicionar"}
              </button>
              {feriasEditandoId ? (
                <button
                  className="secondary-button"
                  onClick={limparEdicaoFerias}
                  type="button"
                >
                  Cancelar
                </button>
              ) : null}
            </form>
            <div className="summary-grid compact-summary">
              <div>
                <span>Periodo aquisitivo</span>
                <strong>
                  {feriasSummary.periodo_aquisitivo_inicio
                    ? `${feriasSummary.periodo_aquisitivo_inicio} a ${feriasSummary.periodo_aquisitivo_fim}`
                    : "-"}
                </strong>
              </div>
              <div>
                <span>Anos aquisitivos</span>
                <strong>{feriasSummary.anos_aquisitivos || 0}</strong>
              </div>
              <div>
                <span>Dias adquiridos</span>
                <strong>{feriasSummary.dias_adquiridos || 0} dias</strong>
              </div>
              <div>
                <span>Dias gozados</span>
                <strong>{feriasSummary.total_dias_gozados || 0} dias</strong>
              </div>
              <div>
                <span>Saldo</span>
                <strong>{feriasSummary.saldo_ferias_dias || 0} dias</strong>
              </div>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Inicio gozado</th>
                    <th>Fim gozado</th>
                    <th>Dias</th>
                    <th>Valor calculado</th>
                    <th>Abono</th>
                    <th>Total</th>
                    <th>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {ferias.map((item) => (
                    <tr key={item.id_ferias}>
                      <td>{item.inicio_gozado}</td>
                      <td>{item.fim_gozado}</td>
                      <td>{item.dias_gozados} dias</td>
                      <td>{dinheiro(item.valor_ferias)}</td>
                      <td>{dinheiro(item.valor_abono)}</td>
                      <td>{dinheiro(item.valor_total_ferias)}</td>
                      <td>
                        <span className="inline-actions">
                          <button
                            className="secondary-button tiny-button"
                            onClick={() => editarFerias(item)}
                            type="button"
                          >
                            Editar
                          </button>
                          <button
                            className="secondary-button tiny-button danger-button"
                            onClick={() => excluirFerias(item)}
                            type="button"
                          >
                            Excluir
                          </button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="2">
                      <strong>Total de férias gozadas</strong>
                    </td>
                    <td>
                      <strong>
                        {feriasSummary.total_dias_gozados || 0} dias
                      </strong>
                    </td>
                    <td>
                      <strong>
                        {dinheiro(
                          ferias.reduce(
                            (total, item) => total + numero(item.valor_ferias),
                            0,
                          ),
                        )}
                      </strong>
                    </td>
                    <td>
                      <strong>
                        {dinheiro(
                          ferias.reduce(
                            (total, item) => total + numero(item.valor_abono),
                            0,
                          ),
                        )}
                      </strong>
                    </td>
                    <td>
                      <strong>
                        {dinheiro(
                          ferias.reduce(
                            (total, item) =>
                              total + numero(item.valor_total_ferias),
                            0,
                          ),
                        )}
                      </strong>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
              {!ferias.length ? (
                <p className="empty-state">Nenhum registro de férias.</p>
              ) : null}
            </div>
            <div className="pagination-row">
              <button
                className="secondary-button"
                disabled={feriasPage <= 1}
                onClick={() => setFeriasPage((current) => current - 1)}
                type="button"
              >
                Anterior
              </button>
              <span>
                Pagina {feriasMeta.page} de {feriasMeta.totalPages}
              </span>
              <button
                className="secondary-button"
                disabled={feriasPage >= feriasMeta.totalPages}
                onClick={() => setFeriasPage((current) => current + 1)}
                type="button"
              >
                Proxima
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </main>
  );
}

export default FolhaPage;
