import { useEffect, useMemo, useState } from "react";
import DocumentosPanel from "../../shared/components/DocumentosPanel";
import StatusMessage from "../../shared/components/StatusMessage";
import { normalizePaginated } from "../../shared/services/api";
import {
  atualizarEntidade,
  buscarEntidade,
  criarEntidade,
  listarEntidades,
  removerEntidade,
} from "./entidades.service";

const tipoOptions = ["FUNCIONARIO", "PROPRIETARIO", "CLIENTE", "ARRENDATARIO"];
const PAGE_SIZE = 10;

function onlyDigits(value = "") {
  return String(value).replace(/\D/g, "");
}

function formatCpfCnpj(value = "") {
  const digits = onlyDigits(value).slice(0, 14);

  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatPhone(value = "") {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

const emptyForm = {
  nome: "",
  cpf_cnpj: "",
  tipo_pessoa: "FISICA",
  email: "",
  telefone: "",
  celular: "",
  cidade: "",
  estado: "",
  observacao: "",
  tipos: ["CLIENTE"],
};

function normalizeForm(entidade) {
  if (!entidade) {
    return emptyForm;
  }

  return {
    nome: entidade.nome || "",
    cpf_cnpj: formatCpfCnpj(entidade.cpf_cnpj || ""),
    tipo_pessoa: entidade.tipo_pessoa || "FISICA",
    email: entidade.email || "",
    telefone: formatPhone(entidade.telefone || ""),
    celular: formatPhone(entidade.celular || ""),
    cidade: entidade.cidade || "",
    estado: entidade.estado || "",
    observacao: entidade.observacao || "",
    tipos: entidade.tipos?.length ? entidade.tipos : ["CLIENTE"],
  };
}

function montarPayload(form) {
  return {
    nome: (form.nome || "").trim(),
    cpf_cnpj: onlyDigits(form.cpf_cnpj),
    tipo_pessoa: form.tipo_pessoa || "FISICA",
    email: (form.email || "").trim(),
    telefone: onlyDigits(form.telefone),
    celular: onlyDigits(form.celular),
    cidade: (form.cidade || "").trim(),
    estado: (form.estado || "").trim().toUpperCase(),
    observacao: (form.observacao || "").trim(),
    tipos: form.tipos?.length ? form.tipos : ["CLIENTE"],
  };
}

function EntidadesPage({ onBack }) {
  const [termo, setTermo] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [entidades, setEntidades] = useState([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(() => normalizePaginated([], PAGE_SIZE));
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const selected = useMemo(
    () => entidades.find((entidade) => entidade.id_entidade === selectedId),
    [entidades, selectedId],
  );

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

  return (
    <main className="workspace-page">
      <section className="page-heading">
        <button className="ghost-button" onClick={onBack} type="button">
          Voltar
        </button>
        <div>
          <span>Cadastro</span>
          <h1>Pessoas/Empresas</h1>
        </div>
      </section>

      <StatusMessage status={status} />

      <section className="split-layout">
        <aside className="panel list-panel">
          <div className="panel-heading">
            <h2>Registros</h2>
            <span>{meta.total}</span>
          </div>
          <div className="search-row">
            <input
              onChange={(event) => setTermo(event.target.value)}
              placeholder="Buscar por nome ou CPF/CNPJ"
              type="search"
              value={termo}
            />
            <button
              className="secondary-button"
              disabled={loading}
              onClick={() => carregarLista({ page: 1 })}
              type="button"
            >
              Buscar
            </button>
          </div>
          <div className="filter-row">
            <select
              onChange={(event) => {
                setTipoFiltro(event.target.value);
                carregarLista({ page: 1, tipo: event.target.value || undefined });
              }}
              value={tipoFiltro}
            >
              <option value="">Todos os tipos</option>
              {tipoOptions.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>
          <button
            className="primary-button full"
            onClick={novaEntidade}
            type="button"
          >
            Novo cadastro
          </button>
          <div className="record-list">
            {entidades.map((entidade) => (
              <button
                className={`record-row ${
                  entidade.id_entidade === selectedId ? "active" : ""
                }`}
                key={entidade.id_entidade}
                onClick={() => selecionar(entidade.id_entidade)}
                type="button"
              >
                <strong>{entidade.nome}</strong>
                <span>{formatCpfCnpj(entidade.cpf_cnpj || "")}</span>
                <small>{entidade.tipos?.join(", ") || "Sem tipo"}</small>
              </button>
            ))}
            {!entidades.length ? (
              <p className="empty-state">
                {loading ? "Carregando..." : "Nenhum cadastro encontrado."}
              </p>
            ) : null}
          </div>
          <div className="pagination-row">
            <button
              className="secondary-button"
              disabled={loading || page <= 1}
              onClick={() => carregarLista({ page: page - 1 })}
              type="button"
            >
              Anterior
            </button>
            <span>
              Pagina {page} de {meta.totalPages}
            </span>
            <button
              className="secondary-button"
              disabled={loading || page >= meta.totalPages}
              onClick={() => carregarLista({ page: page + 1 })}
              type="button"
            >
              Proxima
            </button>
          </div>
        </aside>

        <section className="detail-stack">
          <form className="panel form-grid" onSubmit={salvar}>
            <div className="panel-heading span-2">
              <h2>{selected ? selected.nome : "Novo cadastro"}</h2>
            </div>

            <label>
              Nome
              <input
                onChange={(event) => updateField("nome", event.target.value)}
                required
                value={form.nome}
              />
            </label>
            <label>
              CPF/CNPJ
              <input
                inputMode="numeric"
                maxLength={18}
                onChange={(event) =>
                  updateField("cpf_cnpj", formatCpfCnpj(event.target.value))
                }
                required
                value={form.cpf_cnpj}
              />
            </label>
            <label>
              Tipo pessoa
              <select
                onChange={(event) =>
                  updateField("tipo_pessoa", event.target.value)
                }
                value={form.tipo_pessoa}
              >
                <option value="FISICA">Física</option>
                <option value="JURIDICA">Jurídica</option>
              </select>
            </label>
            <label>
              E-mail
              <input
                onChange={(event) => updateField("email", event.target.value)}
                type="email"
                value={form.email}
              />
            </label>
            <label>
              Telefone
              <input
                inputMode="numeric"
                maxLength={15}
                onChange={(event) =>
                  updateField("telefone", formatPhone(event.target.value))
                }
                value={form.telefone}
              />
            </label>
            <label>
              Celular
              <input
                inputMode="numeric"
                maxLength={15}
                onChange={(event) =>
                  updateField("celular", formatPhone(event.target.value))
                }
                value={form.celular}
              />
            </label>
            <label>
              Cidade
              <input
                onChange={(event) => updateField("cidade", event.target.value)}
                value={form.cidade}
              />
            </label>
            <label>
              UF
              <input
                maxLength={2}
                onChange={(event) => updateField("estado", event.target.value)}
                value={form.estado}
              />
            </label>
            <label className="span-2">
              Observação
              <textarea
                onChange={(event) =>
                  updateField("observacao", event.target.value)
                }
                value={form.observacao}
              />
            </label>

            <div className="check-grid span-2">
              {tipoOptions.map((tipo) => (
                <label className="check-row" key={tipo}>
                  <input
                    checked={form.tipos.includes(tipo)}
                    onChange={() => toggleTipo(tipo)}
                    type="checkbox"
                  />
                  {tipo}
                </label>
              ))}
            </div>

            <div className="form-actions span-2">
              {selectedId ? (
                <button
                  className="secondary-button"
                  disabled={loading}
                  onClick={remover}
                  type="button"
                >
                  Remover
                </button>
              ) : null}
              <button
                className="primary-button"
                disabled={loading}
                type="submit"
              >
                Salvar
              </button>
            </div>
          </form>

          <DocumentosPanel origem="ENTIDADE" ownerId={selectedId} />
        </section>
      </section>
    </main>
  );
}

export default EntidadesPage;
