import { useEffect, useMemo, useState } from 'react'
import { listarEntidades } from '../entidades/entidades.service'
import DocumentosPanel from '../../shared/components/DocumentosPanel'
import StatusMessage from '../../shared/components/StatusMessage'
import { normalizePaginated } from '../../shared/services/api'
import {
  atualizarImovel,
  buscarImovel,
  criarImovel,
  listarImoveis,
  removerImovel,
} from './imoveis.service'

const PAGE_SIZE = 10

const emptyForm = {
  nome: '',
  lote: '',
  municipio: '',
  n_lote: '',
  gleba: '',
  colonia: '',
  matricula: '',
  nirf: '',
  incra: '',
  proprietarios_ids: [],
  area_total: '',
  observacao: '',
}

function mascaraNirf(value) {
  const d = value.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 1) return d
  if (d.length <= 4) return `${d[0]}.${d.slice(1)}`
  if (d.length <= 7) return `${d[0]}.${d.slice(1, 4)}.${d.slice(4)}`
  return `${d[0]}.${d.slice(1, 4)}.${d.slice(4, 7)}-${d[7]}`
}

function mascaraIncra(value) {
  const d = value.replace(/\D/g, '').slice(0, 13)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  if (d.length <= 12) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}.${d.slice(9)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}.${d.slice(9, 12)}-${d[12]}`
}

function mascaraMatricula(value) {
  const d = value.replace(/\D/g, '').slice(0, 9)
  return d.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function normalizeForm(imovel) {
  if (!imovel) return emptyForm
  return {
    nome: imovel.nome || '',
    lote: imovel.lote || '',
    municipio: imovel.municipio || '',
    n_lote: imovel.n_lote || '',
    gleba: imovel.gleba || '',
    colonia: imovel.colonia || '',
    matricula: imovel.matricula || '',
    nirf: imovel.nirf || '',
    incra: imovel.incra || '',
    proprietarios_ids: imovel.proprietarios?.map((p) => p.id_entidade) ?? [],
    area_total: imovel.area_total || '',
    observacao: imovel.observacao || '',
  }
}

function montarPayload(form) {
  return {
    nome: form.nome,
    lote: form.lote,
    municipio: form.municipio,
    n_lote: form.n_lote,
    gleba: form.gleba,
    colonia: form.colonia,
    matricula: form.matricula,
    nirf: form.nirf,
    incra: form.incra,
    proprietarios_ids: form.proprietarios_ids,
    area_total: form.area_total,
    observacao: form.observacao,
  }
}

function calcularAlqueires(ha) {
  const valor = parseFloat(ha)
  if (!ha || isNaN(valor) || valor <= 0) return ''
  return (valor / 2.42).toFixed(4)
}

function ImoveisPage({ onBack }) {
  const [termo, setTermo] = useState('')
  const [municipioFiltro, setMunicipioFiltro] = useState('')
  const [imoveis, setImoveis] = useState([])
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(() => normalizePaginated([], PAGE_SIZE))
  const [entidades, setEntidades] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const selected = useMemo(
    () => imoveis.find((imovel) => imovel.id_imovel === selectedId),
    [imoveis, selectedId],
  )

  const areaAlq = useMemo(() => calcularAlqueires(form.area_total), [form.area_total])

  useEffect(() => {
    let active = true

    async function carregarInicial() {
      setLoading(true)
      setStatus(null)

      try {
        const [loadedImoveis, loadedEntidades] = await Promise.all([
          listarImoveis({ page: 1, limit: PAGE_SIZE }),
          listarEntidades({ ativo: true, limit: 100 }),
        ])
        const imoveisPage = normalizePaginated(loadedImoveis, PAGE_SIZE)
        const entidadesPage = normalizePaginated(loadedEntidades, 100)

        if (!active) return
        setPage(imoveisPage.page)
        setMeta(imoveisPage)
        setImoveis(imoveisPage.items)
        setEntidades(entidadesPage.items)

        if (imoveisPage.items[0]) {
          setSelectedId(imoveisPage.items[0].id_imovel)
          setForm(normalizeForm(imoveisPage.items[0]))
        }
      } catch (error) {
        if (active) setStatus({ type: 'error', message: error.message })
      } finally {
        if (active) setLoading(false)
      }
    }

    carregarInicial()
    return () => {
      active = false
    }
  }, [])

  async function carregarDados(params = {}) {
    setLoading(true)
    setStatus(null)

    try {
      const loadedImoveis = await listarImoveis({
        termo,
        municipio: municipioFiltro || undefined,
        page: params.page || page,
        limit: PAGE_SIZE,
        ...params,
      })
      const imoveisPage = normalizePaginated(loadedImoveis, PAGE_SIZE)

      setPage(imoveisPage.page)
      setMeta(imoveisPage)
      setImoveis(imoveisPage.items)

      if (!selectedId && imoveisPage.items[0]) {
        setSelectedId(imoveisPage.items[0].id_imovel)
        setForm(normalizeForm(imoveisPage.items[0]))
      }
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  async function selecionar(id) {
    setLoading(true)
    setStatus(null)

    try {
      const imovel = await buscarImovel(id)
      setSelectedId(id)
      setForm(normalizeForm(imovel))
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  function novoImovel() {
    setSelectedId(null)
    setForm(emptyForm)
    setStatus(null)
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function toggleProprietario(id) {
    setForm((current) => {
      const ids = current.proprietarios_ids
      return {
        ...current,
        proprietarios_ids: ids.includes(id)
          ? ids.filter((x) => x !== id)
          : [...ids, id],
      }
    })
  }

  async function salvar(event) {
    event.preventDefault()
    setLoading(true)
    setStatus(null)

    try {
      const payload = montarPayload(form)
      const saved = selectedId
        ? await atualizarImovel(selectedId, payload)
        : await criarImovel(payload)

      setSelectedId(saved.id_imovel)
      setForm(normalizeForm(saved))
      setStatus({ type: 'success', message: 'Imóvel salvo.' })
      await carregarDados({ page })
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  async function remover() {
    if (!selectedId) return

    setLoading(true)
    setStatus(null)

    try {
      await removerImovel(selectedId)
      setStatus({ type: 'success', message: 'Imóvel removido.' })
      setSelectedId(null)
      setForm(emptyForm)
      await carregarDados()
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="workspace-page">
      <section className="page-heading">
        <button className="ghost-button" onClick={onBack} type="button">
          Voltar
        </button>
        <div>
          <span>Cadastro rural</span>
          <h1>Imóveis</h1>
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
              placeholder="Buscar por nome, município ou matrícula"
              type="search"
              value={termo}
            />
            <button
              className="secondary-button"
              disabled={loading}
              onClick={() => carregarDados({ page: 1 })}
              type="button"
            >
              Buscar
            </button>
          </div>
          <div className="filter-row">
            <input
              onChange={(event) => {
                setMunicipioFiltro(event.target.value)
                carregarDados({ page: 1, municipio: event.target.value || undefined })
              }}
              placeholder="Filtrar por município"
              type="search"
              value={municipioFiltro}
            />
          </div>
          <button className="primary-button full" onClick={novoImovel} type="button">
            Novo imóvel
          </button>
          <div className="record-list">
            {imoveis.map((imovel) => (
              <button
                className={`record-row ${imovel.id_imovel === selectedId ? 'active' : ''}`}
                key={imovel.id_imovel}
                onClick={() => selecionar(imovel.id_imovel)}
                type="button"
              >
                <strong>{imovel.nome}</strong>
                <span>{imovel.nirf || imovel.incra || imovel.matricula || 'Sem registro'}</span>
                <small>{imovel.municipio || imovel.cidade || 'Sem município'}</small>
              </button>
            ))}
            {!imoveis.length ? (
              <p className="empty-state">
                {loading ? 'Carregando...' : 'Nenhum imóvel encontrado.'}
              </p>
            ) : null}
          </div>
          <div className="pagination-row">
            <button
              className="secondary-button"
              disabled={loading || page <= 1}
              onClick={() => carregarDados({ page: page - 1 })}
              type="button"
            >
              Anterior
            </button>
            <span>
              Página {page} de {meta.totalPages}
            </span>
            <button
              className="secondary-button"
              disabled={loading || page >= meta.totalPages}
              onClick={() => carregarDados({ page: page + 1 })}
              type="button"
            >
              Próxima
            </button>
          </div>
        </aside>

        <section className="detail-stack">
          <form className="panel form-grid" onSubmit={salvar}>
            <div className="panel-heading span-2">
              <h2>{selected ? selected.nome : 'Novo imóvel'}</h2>
            </div>

            <fieldset className="span-2 field-group">
              <legend>Identificação do imóvel</legend>

              <label className="span-2">
                Nome do imóvel
                <input
                  onChange={(event) => updateField('nome', event.target.value)}
                  required
                  value={form.nome}
                />
              </label>

              <label>
                Lote
                <input
                  onChange={(event) => updateField('lote', event.target.value)}
                  value={form.lote}
                />
              </label>
              <label>
                Município
                <input
                  onChange={(event) => updateField('municipio', event.target.value)}
                  value={form.municipio}
                />
              </label>

              <label>
                N.º do lote
                <input
                  onChange={(event) => updateField('n_lote', event.target.value)}
                  value={form.n_lote}
                />
              </label>
              <label>
                Gleba
                <input
                  onChange={(event) => updateField('gleba', event.target.value)}
                  value={form.gleba}
                />
              </label>

              <label>
                Colônia
                <input
                  onChange={(event) => updateField('colonia', event.target.value)}
                  value={form.colonia}
                />
              </label>
              <label>
                Matrícula
                <input
                  inputMode="numeric"
                  maxLength={11}
                  onChange={(event) =>
                    updateField('matricula', mascaraMatricula(event.target.value))
                  }
                  placeholder="000.000"
                  value={form.matricula}
                />
              </label>

              <label>
                NIRF
                <input
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(event) =>
                    updateField('nirf', mascaraNirf(event.target.value))
                  }
                  placeholder="0.000.000-0"
                  value={form.nirf}
                />
              </label>
              <label>
                INCRA
                <input
                  inputMode="numeric"
                  maxLength={17}
                  onChange={(event) =>
                    updateField('incra', mascaraIncra(event.target.value))
                  }
                  placeholder="000.000.000.000-0"
                  value={form.incra}
                />
              </label>

              <div className="span-2">
                <p className="field-label">
                  Proprietários
                  {form.proprietarios_ids.length > 0 && (
                    <span className="badge">{form.proprietarios_ids.length} selecionado(s)</span>
                  )}
                </p>
                <div className="check-grid proprietarios-list">
                  {entidades.map((entidade) => (
                    <label className="check-row" key={entidade.id_entidade}>
                      <input
                        checked={form.proprietarios_ids.includes(entidade.id_entidade)}
                        onChange={() => toggleProprietario(entidade.id_entidade)}
                        type="checkbox"
                      />
                      {entidade.nome}
                    </label>
                  ))}
                  {!entidades.length && (
                    <p className="empty-state">Nenhuma pessoa cadastrada.</p>
                  )}
                </div>
              </div>
            </fieldset>

            <fieldset className="span-2 field-group">
              <legend>Área</legend>

              <label>
                Área em Há
                <input
                  min="0"
                  onChange={(event) => updateField('area_total', event.target.value)}
                  step="0.0001"
                  type="number"
                  value={form.area_total}
                />
              </label>
              <label>
                Área em Alqueires
                <input
                  readOnly
                  title="Calculado automaticamente (1 alqueire paulista = 2,42 ha)"
                  type="text"
                  value={areaAlq}
                />
              </label>

              <label className="span-2">
                Observação
                <textarea
                  onChange={(event) => updateField('observacao', event.target.value)}
                  value={form.observacao}
                />
              </label>
            </fieldset>

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
              <button className="primary-button" disabled={loading} type="submit">
                Salvar
              </button>
            </div>
          </form>

          <DocumentosPanel origem="IMOVEL" ownerId={selectedId} />
        </section>
      </section>
    </main>
  )
}

export default ImoveisPage
