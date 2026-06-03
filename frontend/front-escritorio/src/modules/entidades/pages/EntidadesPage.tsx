import { useEffect, useMemo, useState } from "react";
import DocumentosPanel from "@/shared/components/data-display/DocumentosPanel";
import StatusMessage from "@/shared/components/feedback/StatusMessage";
import { Button } from "@/shared/components/ui/button";
import { normalizePaginated } from "@/shared/services/api";
import { formatDateTimeBR } from "@/shared/utils/date";
import EntidadeForm from "../components/EntidadeForm";
import EntidadesListPanel from "../components/EntidadesListPanel";
import EntidadesPrintReport from "../components/EntidadesPrintReport";
import {
  atualizarEntidade,
  buscarEntidade,
  criarEntidade,
  listarEntidades,
  removerEntidade,
} from "../services/entidades.service";
import {
  PAGE_SIZE,
  emptyForm,
  montarPayload,
  normalizeForm,
  tipoPessoaLabel,
} from "../utils";

function EntidadesPage({ onBack }) {
  const [termo, setTermo] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [tipoPessoaFiltro, setTipoPessoaFiltro] = useState("");
  const [entidades, setEntidades] = useState([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(() => normalizePaginated([], PAGE_SIZE));
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [pendingPrint, setPendingPrint] = useState(false);

  const selected = useMemo(
    () => entidades.find((entidade) => entidade.id_entidade === selectedId),
    [entidades, selectedId],
  );

  useEffect(() => {
    if (!pendingPrint || !reportData) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      window.print();
      setPendingPrint(false);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [pendingPrint, reportData]);

  useEffect(() => {
    let active = true;

    async function carregarInicial() {
      setLoading(true);
      setStatus(null);

      try {
        const data = normalizePaginated(
          await listarEntidades({ page: 1, limit: PAGE_SIZE }),
          PAGE_SIZE,
        );

        if (!active) return;
        setPage(data.page);
        setMeta(data);
        setEntidades(data.items);
        if (data.items[0]) {
          setSelectedId(data.items[0].id_entidade);
          setForm(normalizeForm(data.items[0]));
        }
      } catch (error) {
        if (active) setStatus({ type: "error", message: error.message });
      } finally {
        if (active) setLoading(false);
      }
    }

    carregarInicial();
    return () => {
      active = false;
    };
  }, []);

  async function carregarLista(params = {}) {
    setLoading(true);
    setStatus(null);

    try {
      const data = normalizePaginated(
        await listarEntidades({
          termo,
          tipo: tipoFiltro || undefined,
          tipo_pessoa: tipoPessoaFiltro || undefined,
          page: params.page || page,
          limit: PAGE_SIZE,
          ...params,
        }),
        PAGE_SIZE,
      );
      setPage(data.page);
      setMeta(data);
      setEntidades(data.items);
      if (!selectedId && data.items[0]) {
        setSelectedId(data.items[0].id_entidade);
        setForm(normalizeForm(data.items[0]));
      }
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function selecionar(id) {
    setLoading(true);
    setStatus(null);

    try {
      const entidade = await buscarEntidade(id);
      setSelectedId(id);
      setForm(normalizeForm(entidade));
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }

  function novaEntidade() {
    setSelectedId(null);
    setForm(emptyForm);
    setStatus(null);
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleTipo(tipo) {
    setForm((current) => {
      const exists = current.tipos.includes(tipo);
      const tipos = exists
        ? current.tipos.filter((item) => item !== tipo)
        : [...current.tipos, tipo];

      return { ...current, tipos: tipos.length ? tipos : ["CLIENTE"] };
    });
  }

  async function salvar(event) {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const payload = montarPayload(form);
      const saved = selectedId
        ? await atualizarEntidade(selectedId, payload)
        : await criarEntidade(payload);

      setSelectedId(saved.id_entidade);
      setForm(normalizeForm(saved));
      setStatus({ type: "success", message: "Cadastro salvo." });
      await carregarLista({ page });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function remover() {
    if (!selectedId) {
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      await removerEntidade(selectedId);
      setStatus({ type: "success", message: "Cadastro removido." });
      setSelectedId(null);
      setForm(emptyForm);
      await carregarLista();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function imprimirRelatorio() {
    setLoading(true);
    setStatus(null);

    try {
      const filtros = {
        termo,
        tipo: tipoFiltro || undefined,
        tipo_pessoa: tipoPessoaFiltro || undefined,
      };
      const totalPreview = normalizePaginated(
        await listarEntidades({ ...filtros, page: 1, limit: 1 }),
        1,
      );
      const limit = Math.max(totalPreview.total, 1);
      const data = normalizePaginated(
        await listarEntidades({ ...filtros, page: 1, limit }),
        limit,
      );

      if (!data.items.length) {
        setStatus({
          type: "warning",
          message: "Nenhum cadastro encontrado para os filtros selecionados.",
        });
        return;
      }

      const tipoPessoa = tipoPessoaLabel(tipoPessoaFiltro);
      const relatorio = {
        title: "Relatório de Pessoas/Empresas",
        subtitle: `${data.total} registro(s) encontrado(s)`,
        emittedAt: formatDateTimeBR(new Date()),
        filters: [
          { label: "Pesquisa", value: termo },
          {
            label: "Tipo de pessoa",
            value: tipoPessoaFiltro ? tipoPessoa : "",
          },
          { label: "Vínculo", value: tipoFiltro },
        ],
        rows: data.items,
        totals: [{ label: "Registros", value: data.total }],
      };

      setReportData(relatorio);
      setPendingPrint(true);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid gap-5 px-5 py-7 sm:px-7">
      <section className="no-print flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button onClick={onBack} type="button" variant="outline">
          Voltar
        </Button>
        <div>
          <span className="text-xs font-black uppercase tracking-wide text-emerald-800">
            Cadastro
          </span>
          <h1 className="mt-1 text-4xl font-bold leading-tight text-slate-950">
            Pessoas/Empresas
          </h1>
        </div>
      </section>

      <StatusMessage status={status} />

      <section className="no-print grid items-start gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
        <EntidadesListPanel
          entidades={entidades}
          loading={loading}
          meta={meta}
          onNew={novaEntidade}
          onPageChange={(nextPage) => carregarLista({ page: nextPage })}
          onPrint={imprimirRelatorio}
          onSearch={() => carregarLista({ page: 1 })}
          onSearchChange={setTermo}
          onSelect={selecionar}
          onTipoChange={(value) => {
            setTipoFiltro(value);
            carregarLista({
              page: 1,
              tipo: value || undefined,
            });
          }}
          onTipoPessoaChange={(value) => {
            setTipoPessoaFiltro(value);
            carregarLista({
              page: 1,
              tipo_pessoa: value || undefined,
            });
          }}
          page={page}
          selectedId={selectedId}
          termo={termo}
          tipoFiltro={tipoFiltro}
          tipoPessoaFiltro={tipoPessoaFiltro}
        />

        <section className="grid min-w-0 gap-5">
          <EntidadeForm
            form={form}
            loading={loading}
            onFieldChange={updateField}
            onRemove={remover}
            onSubmit={salvar}
            onToggleTipo={toggleTipo}
            selected={selected}
            selectedId={selectedId}
          />

          <DocumentosPanel origem="ENTIDADE" ownerId={selectedId} />
        </section>
      </section>

      {reportData ? <EntidadesPrintReport reportData={reportData} /> : null}
    </main>
  );
}

export default EntidadesPage;
