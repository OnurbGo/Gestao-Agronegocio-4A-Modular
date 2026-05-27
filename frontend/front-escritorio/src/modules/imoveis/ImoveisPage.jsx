import { useEffect, useMemo, useState } from 'react'
import { listarEntidades } from '../entidades/entidades.service'
import DocumentosPanel from '../documentos/DocumentosPanel'
import StatusMessage from '../../shared/components/StatusMessage'
import {
  atualizarImovel,
  buscarImovel,
  criarImovel,
  listarImoveis,
  removerImovel,
} from './imoveis.service'

const emptyForm = {
  nome: '',
  codigo: '',
  matricula: '',
  proprietario_entidade_id: '',
  area_total: '',
  area_agricultavel: '',
  cidade: '',
  estado: '',
  observacao: '',
  ativo: true,
}

function normalizeForm(imovel) {
  if (!imovel) {
    return emptyForm
  }

  return {
    ...emptyForm,
    ...imovel,
    codigo: imovel.codigo || '',
    matricula: imovel.matricula || '',
    proprietario_entidade_id: imovel.proprietario_entidade_id || '',
    area_total: imovel.area_total || '',
    area_agricultavel: imovel.area_agricultavel || '',
    cidade: imovel.cidade || '',
    estado: imovel.estado || '',
    observacao: imovel.observacao || '',
  }
}

function ImoveisPage({ onBack }) {
  const [termo, setTermo] = useState('')
  const [imoveis, setImoveis] = useState([])
  const [entidades, setEntidades] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const selected = useMemo(
    () => imoveis.find((imovel) => imovel.id_imovel === selectedId),
    [imoveis, selectedId],
  )

  useEffect(() => {
    let active = true

    async function carregarInicial() {
      setLoading(true)
      setStatus(null)

      try {
        const [loadedImoveis, loadedEntidades] = await Promise.all([
          listarImoveis({}),
          listarEntidades({ ativo: true }),
        ])

        if (!active) return
        setImoveis(loadedImoveis)
        setEntidades(loadedEntidades)

        if (loadedImoveis[0]) {
          setSelectedId(loadedImoveis[0].id_imovel)
          setForm(normalizeForm(loadedImoveis[0]))
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

  async function carregarDados() {
    setLoading(true)
    setStatus(null)

    try {
      const [loadedImoveis, loadedEntidades] = await Promise.all([
        listarImoveis({ termo }),
        listarEntidades({ ativo: true }),
      ])

      setImoveis(loadedImoveis)
      setEntidades(loadedEntidades)

      if (!selectedId && loadedImoveis[0]) {
        setSelectedId(loadedImoveis[0].id_imovel)
        setForm(normalizeForm(loadedImoveis[0]))
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

  async function salvar(event) {
    event.preventDefault()
    setLoading(true)
    setStatus(null)

    try {
      const saved = selectedId
        ? await atualizarImovel(selectedId, form)
        : await criarImovel(form)

      setSelectedId(saved.id_imovel)
      setForm(normalizeForm(saved))
      setStatus({ type: 'success', message: 'Imovel salvo.' })
      const data = await listarImoveis({ termo })
      setImoveis(data)
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  async function remover() {
    if (!selectedId) {
      return
    }

    setLoading(true)
    setStatus(null)

    try {
      await removerImovel(selectedId)
      setStatus({ type: 'success', message: 'Imovel removido.' })
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
          <h1>Imoveis</h1>
        </div>
      </section>

      <StatusMessage status={status} />

      <section className="split-layout">
        <aside className="panel list-panel">
          <div className="panel-heading">
            <h2>Registros</h2>
            <span>{imoveis.length}</span>
          </div>
          <div className="search-row">
            <input
              onChange={(event) => setTermo(event.target.value)}
              placeholder="Buscar por nome, codigo ou matricula"
              type="search"
              value={termo}
            />
            <button
              className="secondary-button"
              disabled={loading}
              onClick={carregarDados}
              type="button"
            >
              Buscar
            </button>
          </div>
          <button className="primary-button full" onClick={novoImovel} type="button">
            Novo imovel
          </button>
          <div className="record-list">
            {imoveis.map((imovel) => (
              <button
                className={`record-row ${
                  imovel.id_imovel === selectedId ? 'active' : ''
                }`}
                key={imovel.id_imovel}
                onClick={() => selecionar(imovel.id_imovel)}
                type="button"
              >
                <strong>{imovel.nome}</strong>
                <span>{imovel.matricula || imovel.codigo || 'Sem codigo'}</span>
                <small>{imovel.cidade || 'Sem cidade'}</small>
              </button>
            ))}
            {!imoveis.length ? (
              <p className="empty-state">
                {loading ? 'Carregando...' : 'Nenhum imovel encontrado.'}
              </p>
            ) : null}
          </div>
        </aside>

        <section className="detail-stack">
          <form className="panel form-grid" onSubmit={salvar}>
            <div className="panel-heading">
              <h2>{selected ? selected.nome : 'Novo imovel'}</h2>
              <span>{form.ativo ? 'Ativo' : 'Inativo'}</span>
            </div>

            <label>
              Nome
              <input
                onChange={(event) => updateField('nome', event.target.value)}
                required
                value={form.nome}
              />
            </label>
            <label>
              Codigo
              <input
                onChange={(event) => updateField('codigo', event.target.value)}
                value={form.codigo}
              />
            </label>
            <label>
              Matricula
              <input
                onChange={(event) => updateField('matricula', event.target.value)}
                value={form.matricula}
              />
            </label>
            <label>
              Proprietario
              <select
                onChange={(event) =>
                  updateField('proprietario_entidade_id', event.target.value)
                }
                value={form.proprietario_entidade_id}
              >
                <option value="">Sem proprietario</option>
                {entidades.map((entidade) => (
                  <option key={entidade.id_entidade} value={entidade.id_entidade}>
                    {entidade.nome}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Area total
              <input
                min="0"
                onChange={(event) => updateField('area_total', event.target.value)}
                step="0.01"
                type="number"
                value={form.area_total}
              />
            </label>
            <label>
              Area agricultavel
              <input
                min="0"
                onChange={(event) =>
                  updateField('area_agricultavel', event.target.value)
                }
                step="0.01"
                type="number"
                value={form.area_agricultavel}
              />
            </label>
            <label>
              Cidade
              <input
                onChange={(event) => updateField('cidade', event.target.value)}
                value={form.cidade}
              />
            </label>
            <label>
              UF
              <input
                maxLength={2}
                onChange={(event) => updateField('estado', event.target.value)}
                value={form.estado}
              />
            </label>
            <label className="span-2">
              Observacao
              <textarea
                onChange={(event) => updateField('observacao', event.target.value)}
                value={form.observacao}
              />
            </label>
            <label className="check-row span-2">
              <input
                checked={form.ativo}
                onChange={(event) => updateField('ativo', event.target.checked)}
                type="checkbox"
              />
              Ativo
            </label>

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
