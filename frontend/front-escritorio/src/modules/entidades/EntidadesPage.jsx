import { useEffect, useMemo, useState } from 'react'
import DocumentosPanel from '../documentos/DocumentosPanel'
import StatusMessage from '../../shared/components/StatusMessage'
import {
  atualizarEntidade,
  buscarEntidade,
  criarEntidade,
  listarEntidades,
  removerEntidade,
} from './entidades.service'

const tipoOptions = ['FUNCIONARIO', 'PROPRIETARIO', 'CLIENTE', 'ARRENDATARIO']

const emptyForm = {
  nome: '',
  cpf_cnpj: '',
  tipo_pessoa: 'FISICA',
  email: '',
  telefone: '',
  celular: '',
  cidade: '',
  estado: '',
  observacao: '',
  participa_folha: false,
  ativo: true,
  tipos: ['CLIENTE'],
}

function normalizeForm(entidade) {
  if (!entidade) {
    return emptyForm
  }

  return {
    ...emptyForm,
    ...entidade,
    email: entidade.email || '',
    telefone: entidade.telefone || '',
    celular: entidade.celular || '',
    cidade: entidade.cidade || '',
    estado: entidade.estado || '',
    observacao: entidade.observacao || '',
    tipos: entidade.tipos?.length ? entidade.tipos : ['CLIENTE'],
  }
}

function EntidadesPage({ onBack }) {
  const [termo, setTermo] = useState('')
  const [entidades, setEntidades] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const selected = useMemo(
    () => entidades.find((entidade) => entidade.id_entidade === selectedId),
    [entidades, selectedId],
  )

  useEffect(() => {
    let active = true

    async function carregarInicial() {
      setLoading(true)
      setStatus(null)

      try {
        const data = await listarEntidades({})

        if (!active) return
        setEntidades(data)
        if (data[0]) {
          setSelectedId(data[0].id_entidade)
          setForm(normalizeForm(data[0]))
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

  async function carregarLista(params = {}) {
    setLoading(true)
    setStatus(null)

    try {
      const data = await listarEntidades({ termo, ...params })
      setEntidades(data)
      if (!selectedId && data[0]) {
        setSelectedId(data[0].id_entidade)
        setForm(normalizeForm(data[0]))
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
      const entidade = await buscarEntidade(id)
      setSelectedId(id)
      setForm(normalizeForm(entidade))
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  function novaEntidade() {
    setSelectedId(null)
    setForm(emptyForm)
    setStatus(null)
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function toggleTipo(tipo) {
    setForm((current) => {
      const exists = current.tipos.includes(tipo)
      const tipos = exists
        ? current.tipos.filter((item) => item !== tipo)
        : [...current.tipos, tipo]

      return { ...current, tipos: tipos.length ? tipos : ['CLIENTE'] }
    })
  }

  async function salvar(event) {
    event.preventDefault()
    setLoading(true)
    setStatus(null)

    try {
      const saved = selectedId
        ? await atualizarEntidade(selectedId, form)
        : await criarEntidade(form)

      setSelectedId(saved.id_entidade)
      setForm(normalizeForm(saved))
      setStatus({ type: 'success', message: 'Entidade salva.' })
      const data = await listarEntidades({ termo })
      setEntidades(data)
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
      await removerEntidade(selectedId)
      setStatus({ type: 'success', message: 'Entidade removida.' })
      setSelectedId(null)
      setForm(emptyForm)
      await carregarLista()
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
          <span>Cadastro</span>
          <h1>Entidades</h1>
        </div>
      </section>

      <StatusMessage status={status} />

      <section className="split-layout">
        <aside className="panel list-panel">
          <div className="panel-heading">
            <h2>Registros</h2>
            <span>{entidades.length}</span>
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
              onClick={() => carregarLista()}
              type="button"
            >
              Buscar
            </button>
          </div>
          <button className="primary-button full" onClick={novaEntidade} type="button">
            Nova entidade
          </button>
          <div className="record-list">
            {entidades.map((entidade) => (
              <button
                className={`record-row ${
                  entidade.id_entidade === selectedId ? 'active' : ''
                }`}
                key={entidade.id_entidade}
                onClick={() => selecionar(entidade.id_entidade)}
                type="button"
              >
                <strong>{entidade.nome}</strong>
                <span>{entidade.cpf_cnpj}</span>
                <small>{entidade.tipos?.join(', ') || 'Sem tipo'}</small>
              </button>
            ))}
            {!entidades.length ? (
              <p className="empty-state">
                {loading ? 'Carregando...' : 'Nenhuma entidade encontrada.'}
              </p>
            ) : null}
          </div>
        </aside>

        <section className="detail-stack">
          <form className="panel form-grid" onSubmit={salvar}>
            <div className="panel-heading">
              <h2>{selected ? selected.nome : 'Nova entidade'}</h2>
              <span>{form.ativo ? 'Ativa' : 'Inativa'}</span>
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
              CPF/CNPJ
              <input
                onChange={(event) => updateField('cpf_cnpj', event.target.value)}
                required
                value={form.cpf_cnpj}
              />
            </label>
            <label>
              Tipo pessoa
              <select
                onChange={(event) => updateField('tipo_pessoa', event.target.value)}
                value={form.tipo_pessoa}
              >
                <option value="FISICA">Fisica</option>
                <option value="JURIDICA">Juridica</option>
              </select>
            </label>
            <label>
              E-mail
              <input
                onChange={(event) => updateField('email', event.target.value)}
                type="email"
                value={form.email}
              />
            </label>
            <label>
              Telefone
              <input
                onChange={(event) => updateField('telefone', event.target.value)}
                value={form.telefone}
              />
            </label>
            <label>
              Celular
              <input
                onChange={(event) => updateField('celular', event.target.value)}
                value={form.celular}
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
              <label className="check-row">
                <input
                  checked={form.participa_folha}
                  onChange={(event) =>
                    updateField('participa_folha', event.target.checked)
                  }
                  type="checkbox"
                />
                Participa da folha
              </label>
              <label className="check-row">
                <input
                  checked={form.ativo}
                  onChange={(event) => updateField('ativo', event.target.checked)}
                  type="checkbox"
                />
                Ativa
              </label>
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
              <button className="primary-button" disabled={loading} type="submit">
                Salvar
              </button>
            </div>
          </form>

          <DocumentosPanel origem="ENTIDADE" ownerId={selectedId} />
        </section>
      </section>
    </main>
  )
}

export default EntidadesPage
