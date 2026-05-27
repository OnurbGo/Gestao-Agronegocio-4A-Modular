import { useEffect, useMemo, useState } from 'react'
import { listarEntidades } from '../entidades/entidades.service'
import { listarImoveis } from '../imoveis/imoveis.service'
import StatusMessage from '../../shared/components/StatusMessage'
import {
  atualizarContrato,
  buscarContrato,
  criarContrato,
  listarContratos,
  removerContrato,
} from './contratos.service'

const emptyForm = {
  numero: '',
  entidade_id: '',
  imovel_id: '',
  safra: '',
  produto: '',
  quantidade_prevista: '0',
  unidade: 'KG',
  data_inicial: '',
  data_final: '',
  status: 'RASCUNHO',
  observacao: '',
  ativo: true,
}

function normalizeForm(contrato) {
  if (!contrato) {
    return emptyForm
  }

  return {
    ...emptyForm,
    ...contrato,
    entidade_id: contrato.entidade_id || '',
    imovel_id: contrato.imovel_id || '',
    quantidade_prevista: contrato.quantidade_prevista || '0',
    observacao: contrato.observacao || '',
  }
}

function ContratosPage({ onBack }) {
  const [termo, setTermo] = useState('')
  const [contratos, setContratos] = useState([])
  const [entidades, setEntidades] = useState([])
  const [imoveis, setImoveis] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const selected = useMemo(
    () => contratos.find((contrato) => contrato.id_contrato === selectedId),
    [contratos, selectedId],
  )

  useEffect(() => {
    let active = true

    async function carregarInicial() {
      setLoading(true)
      setStatus(null)

      try {
        const [loadedContratos, loadedEntidades, loadedImoveis] = await Promise.all([
          listarContratos({}),
          listarEntidades({ ativo: true }),
          listarImoveis({ ativo: true }),
        ])

        if (!active) return
        setContratos(loadedContratos)
        setEntidades(loadedEntidades)
        setImoveis(loadedImoveis)

        if (loadedContratos[0]) {
          setSelectedId(loadedContratos[0].id_contrato)
          setForm(normalizeForm(loadedContratos[0]))
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
      const [loadedContratos, loadedEntidades, loadedImoveis] = await Promise.all([
        listarContratos({ termo }),
        listarEntidades({ ativo: true }),
        listarImoveis({ ativo: true }),
      ])

      setContratos(loadedContratos)
      setEntidades(loadedEntidades)
      setImoveis(loadedImoveis)

      if (!selectedId && loadedContratos[0]) {
        setSelectedId(loadedContratos[0].id_contrato)
        setForm(normalizeForm(loadedContratos[0]))
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
      const contrato = await buscarContrato(id)
      setSelectedId(id)
      setForm(normalizeForm(contrato))
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  function novoContrato() {
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
        ? await atualizarContrato(selectedId, form)
        : await criarContrato(form)

      setSelectedId(saved.id_contrato)
      setForm(normalizeForm(saved))
      setStatus({ type: 'success', message: 'Contrato salvo.' })
      const data = await listarContratos({ termo })
      setContratos(data)
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
      await removerContrato(selectedId)
      setStatus({ type: 'success', message: 'Contrato removido.' })
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
          <span>Safra e balanca futura</span>
          <h1>Contratos</h1>
        </div>
      </section>

      <StatusMessage status={status} />

      <section className="split-layout">
        <aside className="panel list-panel">
          <div className="panel-heading">
            <h2>Registros</h2>
            <span>{contratos.length}</span>
          </div>
          <div className="search-row">
            <input
              onChange={(event) => setTermo(event.target.value)}
              placeholder="Buscar por numero, safra ou produto"
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
          <button className="primary-button full" onClick={novoContrato} type="button">
            Novo contrato
          </button>
          <div className="record-list">
            {contratos.map((contrato) => (
              <button
                className={`record-row ${
                  contrato.id_contrato === selectedId ? 'active' : ''
                }`}
                key={contrato.id_contrato}
                onClick={() => selecionar(contrato.id_contrato)}
                type="button"
              >
                <strong>{contrato.numero}</strong>
                <span>{contrato.entidade?.nome || 'Sem entidade'}</span>
                <small>
                  {contrato.safra} - {contrato.produto}
                </small>
              </button>
            ))}
            {!contratos.length ? (
              <p className="empty-state">
                {loading ? 'Carregando...' : 'Nenhum contrato encontrado.'}
              </p>
            ) : null}
          </div>
        </aside>

        <form className="panel form-grid" onSubmit={salvar}>
          <div className="panel-heading span-2">
            <h2>{selected ? selected.numero : 'Novo contrato'}</h2>
            <span>{form.status}</span>
          </div>

          <label>
            Numero
            <input
              onChange={(event) => updateField('numero', event.target.value)}
              required
              value={form.numero}
            />
          </label>
          <label>
            Status
            <select
              onChange={(event) => updateField('status', event.target.value)}
              value={form.status}
            >
              <option value="RASCUNHO">Rascunho</option>
              <option value="ATIVO">Ativo</option>
              <option value="ENCERRADO">Encerrado</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </label>
          <label>
            Entidade
            <select
              onChange={(event) => updateField('entidade_id', event.target.value)}
              required
              value={form.entidade_id}
            >
              <option value="">Selecione</option>
              {entidades.map((entidade) => (
                <option key={entidade.id_entidade} value={entidade.id_entidade}>
                  {entidade.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            Imovel
            <select
              onChange={(event) => updateField('imovel_id', event.target.value)}
              value={form.imovel_id}
            >
              <option value="">Sem imovel</option>
              {imoveis.map((imovel) => (
                <option key={imovel.id_imovel} value={imovel.id_imovel}>
                  {imovel.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            Safra
            <input
              onChange={(event) => updateField('safra', event.target.value)}
              required
              value={form.safra}
            />
          </label>
          <label>
            Produto
            <input
              onChange={(event) => updateField('produto', event.target.value)}
              required
              value={form.produto}
            />
          </label>
          <label>
            Quantidade prevista
            <input
              min="0"
              onChange={(event) =>
                updateField('quantidade_prevista', event.target.value)
              }
              step="0.01"
              type="number"
              value={form.quantidade_prevista}
            />
          </label>
          <label>
            Unidade
            <input
              onChange={(event) => updateField('unidade', event.target.value)}
              required
              value={form.unidade}
            />
          </label>
          <label>
            Data inicial
            <input
              onChange={(event) => updateField('data_inicial', event.target.value)}
              required
              type="date"
              value={form.data_inicial}
            />
          </label>
          <label>
            Data final
            <input
              onChange={(event) => updateField('data_final', event.target.value)}
              required
              type="date"
              value={form.data_final}
            />
          </label>
          <label className="span-2">
            Observacao
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
      </section>
    </main>
  )
}

export default ContratosPage
