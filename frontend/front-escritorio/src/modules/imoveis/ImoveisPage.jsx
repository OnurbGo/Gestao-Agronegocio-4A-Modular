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
}

function normalizeForm(imovel) {
  if (!imovel) {
    return emptyForm
  }

  return {
    nome: imovel.nome || '',
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

function montarPayload(form) {
  return {
    nome: form.nome,
    codigo: form.codigo,
    matricula: form.matricula,
    proprietario_entidade_id: form.proprietario_entidade_id,
    area_total: form.area_total,
    area_agricultavel: form.area_agricultavel,
    cidade: form.cidade,
    estado: form.estado,
    observacao: form.observacao,
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
      const payload = montarPayload(form)
      const saved = selectedId
        ? await atualizarImovel(selectedId, payload)
        : await criarImovel(payload)

      setSelectedId(saved.id_imovel)
      setForm(normalizeForm(saved))
      setStatus({ type: 'success', message: 'Imóvel salvo.' })
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
            <span>{imoveis.length}</span>
          </div>
          <div className="search-row">
            <input
              onChange={(event) => setTermo(event.target.value)}
              placeholder="Buscar por nome, código ou matrícula"
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
            Novo imóvel
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
                <span>{imovel.matricula || imovel.codigo || 'Sem código'}</span>
                <small>{imovel.cidade || 'Sem cidade'}</small>
              </button>
            ))}
            {!imoveis.length ? (
              <p className="empty-state">
                {loading ? 'Carregando...' : 'Nenhum imóvel encontrado.'}
              </p>
            ) : null}
          </div>
        </aside>

        <section className="detail-stack">
          <form className="panel form-grid" onSubmit={salvar}>
            <div className="panel-heading span-2">
              <h2>{selected ? selected.nome : 'Novo imóvel'}</h2>
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
              Código
              <input
                onChange={(event) => updateField('codigo', event.target.value)}
                value={form.codigo}
              />
            </label>
            <label>
              Matrícula
              <input
                onChange={(event) => updateField('matricula', event.target.value)}
                value={form.matricula}
              />
            </label>
            <label>
              Proprietário
              <select
                onChange={(event) =>
                  updateField('proprietario_entidade_id', event.target.value)
                }
                value={form.proprietario_entidade_id}
              >
                <option value="">Sem proprietário</option>
                {entidades.map((entidade) => (
                  <option key={entidade.id_entidade} value={entidade.id_entidade}>
                    {entidade.nome}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Área total
              <input
                min="0"
                onChange={(event) => updateField('area_total', event.target.value)}
                step="0.01"
                type="number"
                value={form.area_total}
              />
            </label>
            <label>
              Área agricultável
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
              Observação
              <textarea
                onChange={(event) => updateField('observacao', event.target.value)}
                value={form.observacao}
              />
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
