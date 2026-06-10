import { useEffect, useMemo, useState } from "react";
import { listarEntidades } from "@/shared/services/entidades.service";
import DocumentosPanel from "@/shared/components/data-display/DocumentosPanel";
import StatusMessage from "@/shared/components/feedback/StatusMessage";
import { Button } from "@/shared/components/ui/button";
import { normalizePaginated } from "@/shared/services/api";
import { getApiErrorMessage } from "@/shared/services/api-error";
import {
  notifyError,
  notifySuccess,
  notifyWarning,
} from "@/shared/services/feedback";
import { formatDateTimeBR } from "@/shared/utils/date";
import ImovelForm from "./components/ImovelForm";
import ImoveisListPanel from "./components/ImoveisListPanel";
import ImoveisPrintReport from "./components/ImoveisPrintReport";
import {
  atualizarImovel,
  buscarImovel,
  criarImovel,
  listarImoveis,
  removerImovel,
} from "@/shared/services/imoveis.service";
import {
  PAGE_SIZE,
  calcularAlqueires,
  emptyForm,
  montarPayload,
  normalizeForm,
} from "./helpers";

type ListaParams = {
  page?: number;
  termo?: string;
  lote?: string;
  municipio?: string;
  colonia?: string;
};

function ImoveisPage({ onBack }) {
  const [termo, setTermo] = useState("");
  const [loteFiltro, setLoteFiltro] = useState("");
  const [municipioFiltro, setMunicipioFiltro] = useState("");
  const [coloniaFiltro, setColoniaFiltro] = useState("");
  const [proprietarioTermo, setProprietarioTermo] = useState("");
  const [imoveis, setImoveis] = useState([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(() => normalizePaginated([], PAGE_SIZE));
  const [entidades, setEntidades] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState(null);
  const [formError, setFormError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [pendingPrint, setPendingPrint] = useState(false);

  const selected = useMemo(
    () => imoveis.find((imovel) => imovel.id_imovel === selectedId),
    [imoveis, selectedId],
  );

  const areaAlq = useMemo(
    () => calcularAlqueires(form.area_total),
    [form.area_total],
  );

  const entidadesSelecionadas = useMemo(
    () =>
      form.proprietarios_ids
        .map((id) => entidades.find((entidade) => entidade.id_entidade === id))
        .filter(Boolean),
    [form.proprietarios_ids, entidades],
  );

  const entidadesFiltradas = useMemo(() => {
    const termoNormalizado = proprietarioTermo.trim().toLowerCase();

    if (!termoNormalizado) {
      return [];
    }

    return entidades.filter((entidade) => {
      const nome = (entidade.nome || "").toLowerCase();
      const cpfCnpj = String(entidade.cpf_cnpj || "").toLowerCase();

      return (
        nome.includes(termoNormalizado) || cpfCnpj.includes(termoNormalizado)
      );
    });
  }, [proprietarioTermo, entidades]);

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
        const [loadedImoveis, loadedEntidades] = await Promise.all([
          listarImoveis({ page: 1, limit: PAGE_SIZE }),
          listarEntidades({ ativo: true, limit: 100 }),
        ]);
        const imoveisPage = normalizePaginated(loadedImoveis, PAGE_SIZE);
        const entidadesPage = normalizePaginated(loadedEntidades, 100);

        if (!active) return;
        setPage(imoveisPage.page);
        setMeta(imoveisPage);
        setImoveis(imoveisPage.items);
        setEntidades(entidadesPage.items);

        if (imoveisPage.items[0]) {
          setSelectedId(imoveisPage.items[0].id_imovel);
          setForm(normalizeForm(imoveisPage.items[0]));
        }
      } catch (error) {
        if (active) {
          notifyError(getApiErrorMessage(error, "Erro ao carregar imóveis."));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    carregarInicial();
    return () => {
      active = false;
    };
  }, []);

  async function carregarDados(params: ListaParams = {}) {
    setLoading(true);
    setStatus(null);

    try {
      const loadedImoveis = await listarImoveis({
        termo,
        lote: loteFiltro || undefined,
        municipio: municipioFiltro || undefined,
        colonia: coloniaFiltro || undefined,
        page: params.page || page,
        limit: PAGE_SIZE,
        ...params,
      });
      const imoveisPage = normalizePaginated(loadedImoveis, PAGE_SIZE);

      setPage(imoveisPage.page);
      setMeta(imoveisPage);
      setImoveis(imoveisPage.items);

      if (!selectedId && imoveisPage.items[0]) {
        setSelectedId(imoveisPage.items[0].id_imovel);
        setForm(normalizeForm(imoveisPage.items[0]));
      }
    } catch (error) {
      notifyError(getApiErrorMessage(error, "Erro ao carregar imóveis."));
    } finally {
      setLoading(false);
    }
  }

  async function selecionar(id) {
    setLoading(true);
    setStatus(null);

    try {
      const imovel = await buscarImovel(id);
      setSelectedId(id);
      setForm(normalizeForm(imovel));
      setFormError(null);
    } catch (error) {
      notifyError(getApiErrorMessage(error, "Erro ao carregar imóvel."));
    } finally {
      setLoading(false);
    }
  }

  function novoImovel() {
    setSelectedId(null);
    setForm(emptyForm);
    setStatus(null);
    setFormError(null);
  }

  function updateField(field, value) {
    setFormError(null);
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleEntidade(id) {
    setFormError(null);
    setForm((current) => {
      const ids = current.proprietarios_ids;
      return {
        ...current,
        proprietarios_ids: ids.includes(id)
          ? ids.filter((x) => x !== id)
          : [...ids, id],
      };
    });
  }

  function selecionarEntidade(id) {
    setFormError(null);
    toggleEntidade(id);
    setProprietarioTermo("");
  }

  function removerEntidadeSelecionada(id) {
    setFormError(null);
    setForm((current) => ({
      ...current,
      proprietarios_ids: current.proprietarios_ids.filter(
        (item) => item !== id,
      ),
    }));
  }
  async function salvar(event) {
    event.preventDefault();
    setLoading(true);
    setStatus(null);
    setFormError(null);

    try {
      const payload = montarPayload(form);
      const saved = selectedId
        ? await atualizarImovel(selectedId, payload)
        : await criarImovel(payload);

      setSelectedId(saved.id_imovel);
      setForm(normalizeForm(saved));
      notifySuccess("Imóvel salvo.");
      await carregarDados({ page });
    } catch (error) {
      setFormError(
        getApiErrorMessage(error, "Não foi possível salvar o imóvel."),
      );
    } finally {
      setLoading(false);
    }
  }

  async function remover() {
    if (!selectedId) return;

    setLoading(true);
    setStatus(null);
    setFormError(null);

    try {
      await removerImovel(selectedId);
      notifySuccess("Imóvel removido.");
      setSelectedId(null);
      setForm(emptyForm);
      await carregarDados();
    } catch (error) {
      setFormError(
        getApiErrorMessage(error, "Não foi possível remover o imóvel."),
      );
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
        lote: loteFiltro || undefined,
        municipio: municipioFiltro || undefined,
        colonia: coloniaFiltro || undefined,
      };
      const totalPreview = normalizePaginated(
        await listarImoveis({ ...filtros, page: 1, limit: 1 }),
        1,
      );
      const limit = Math.max(totalPreview.total, 1);
      const data = normalizePaginated(
        await listarImoveis({ ...filtros, page: 1, limit }),
        limit,
      );

      if (!data.items.length) {
        notifyWarning("Nenhum imóvel encontrado para os filtros selecionados.");
        return;
      }

      const relatorio = {
        title: "Relatório de Imóveis",
        subtitle: `${data.total} registro(s) encontrado(s)`,
        emittedAt: formatDateTimeBR(new Date()),
        filters: [
          { label: "Pesquisa", value: termo },
          { label: "Lote", value: loteFiltro },
          { label: "Município", value: municipioFiltro },
          { label: "Colônia", value: coloniaFiltro },
        ],
        rows: data.items,
        totals: [{ label: "Registros", value: data.total }],
      };

      setReportData(relatorio);
      setPendingPrint(true);
    } catch (error) {
      notifyError(getApiErrorMessage(error, "Erro ao gerar relatório."));
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
            Cadastro rural
          </span>
          <h1 className="mt-1 text-4xl font-bold leading-tight text-slate-950">
            Imóveis
          </h1>
        </div>
      </section>

      <StatusMessage status={status} />

      <section className="no-print grid items-start gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
        <ImoveisListPanel
          coloniaFiltro={coloniaFiltro}
          imoveis={imoveis}
          loading={loading}
          loteFiltro={loteFiltro}
          meta={meta}
          municipioFiltro={municipioFiltro}
          onColoniaChange={(value) => {
            setColoniaFiltro(value);
            carregarDados({
              page: 1,
              colonia: value || undefined,
            });
          }}
          onLoteChange={(value) => {
            setLoteFiltro(value);
            carregarDados({
              page: 1,
              lote: value || undefined,
            });
          }}
          onMunicipioChange={(value) => {
            setMunicipioFiltro(value);
            carregarDados({
              page: 1,
              municipio: value || undefined,
            });
          }}
          onNew={novoImovel}
          onPageChange={(nextPage) => carregarDados({ page: nextPage })}
          onPrint={imprimirRelatorio}
          onSearch={() => carregarDados({ page: 1 })}
          onSearchChange={setTermo}
          onSelect={selecionar}
          page={page}
          selectedId={selectedId}
          termo={termo}
        />

        <section className="grid min-w-0 gap-5">
          <ImovelForm
            areaAlq={areaAlq}
            entidadesFiltradas={entidadesFiltradas}
            entidadesSelecionadas={entidadesSelecionadas}
            errorMessage={formError}
            form={form}
            loading={loading}
            onClearError={() => setFormError(null)}
            onFieldChange={updateField}
            onProprietarioRemove={removerEntidadeSelecionada}
            onProprietarioSearchChange={setProprietarioTermo}
            onProprietarioSelect={selecionarEntidade}
            onRemove={remover}
            onSubmit={salvar}
            proprietarioTermo={proprietarioTermo}
            selected={selected}
            selectedId={selectedId}
          />

          <DocumentosPanel origem="IMOVEL" ownerId={selectedId} />
        </section>
      </section>

      {reportData ? <ImoveisPrintReport reportData={reportData} /> : null}
    </main>
  );
}

export default ImoveisPage;
