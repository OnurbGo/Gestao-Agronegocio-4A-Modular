import { useEffect, useRef, useState } from 'react'
import StatusMessage from '../../shared/components/StatusMessage'
import {
  baixarArquivo,
  enviarArquivoEntidade,
  enviarArquivoImovel,
  listarArquivosEntidade,
  listarArquivosImovel,
  listarTiposDocumento,
  removerArquivo,
} from './documentos.service'

function getArquivoId(arquivo, origem) {
  return origem === 'ENTIDADE'
    ? arquivo.id_entidade_arquivo
    : arquivo.id_imovel_arquivo
}

function tamanhoArquivo(bytes = 0) {
  if (!bytes) {
    return '0 KB'
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function DocumentosPanel({ origem, ownerId }) {
  const [tipos, setTipos] = useState([])
  const [arquivos, setArquivos] = useState([])
  const [tipoDocumentoId, setTipoDocumentoId] = useState('')
  const [observacao, setObservacao] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (!ownerId) {
      return
    }

    let active = true

    async function carregarInicial() {
      setLoading(true)
      setStatus(null)

      try {
        const [loadedTipos, loadedArquivos] = await Promise.all([
          listarTiposDocumento(),
          origem === 'ENTIDADE'
            ? listarArquivosEntidade(ownerId)
            : listarArquivosImovel(ownerId),
        ])

        if (!active) return
        setTipos(loadedTipos)
        setArquivos(loadedArquivos)
        setTipoDocumentoId((current) => current || loadedTipos[0]?.id_tipo_documento || '')
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
  }, [ownerId, origem])

  async function carregar() {
    setLoading(true)
    setStatus(null)

    try {
      const [loadedTipos, loadedArquivos] = await Promise.all([
        listarTiposDocumento(),
        origem === 'ENTIDADE'
          ? listarArquivosEntidade(ownerId)
          : listarArquivosImovel(ownerId),
      ])

      setTipos(loadedTipos)
      setArquivos(loadedArquivos)
      setTipoDocumentoId((current) => current || loadedTipos[0]?.id_tipo_documento || '')
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  async function enviar(event) {
    event.preventDefault()

    const arquivo = fileRef.current?.files?.[0]

    if (!arquivo) {
      setStatus({ type: 'warning', message: 'Selecione um arquivo.' })
      return
    }

    const formData = new FormData()
    formData.append('tipo_documento_id', tipoDocumentoId)
    formData.append('observacao', observacao)
    formData.append('arquivo', arquivo)
    setLoading(true)
    setStatus(null)

    try {
      if (origem === 'ENTIDADE') {
        await enviarArquivoEntidade(ownerId, formData)
      } else {
        await enviarArquivoImovel(ownerId, formData)
      }

      setObservacao('')
      if (fileRef.current) {
        fileRef.current.value = ''
      }
      setStatus({ type: 'success', message: 'Arquivo anexado.' })
      await carregar()
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  async function baixar(arquivo) {
    try {
      await baixarArquivo(getArquivoId(arquivo, origem), origem, arquivo.nome_original)
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    }
  }

  async function remover(arquivo) {
    setLoading(true)
    setStatus(null)

    try {
      await removerArquivo(getArquivoId(arquivo, origem), origem)
      setStatus({ type: 'success', message: 'Arquivo removido.' })
      await carregar()
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  if (!ownerId) {
    return (
      <section className="panel">
        <div className="panel-heading">
          <h2>Anexos</h2>
        </div>
        <p className="empty-state">Salve o cadastro antes de anexar documentos.</p>
      </section>
    )
  }

  return (
    <section className="panel documents-panel">
      <div className="panel-heading">
        <h2>Anexos</h2>
        <span>{arquivos.length}</span>
      </div>

      <StatusMessage status={status} />

      <form className="document-form" onSubmit={enviar}>
        <label>
          Tipo
          <select
            onChange={(event) => setTipoDocumentoId(event.target.value)}
            required
            value={tipoDocumentoId}
          >
            {tipos.map((tipo) => (
              <option key={tipo.id_tipo_documento} value={tipo.id_tipo_documento}>
                {tipo.nome}
              </option>
            ))}
          </select>
        </label>
        <label>
          Arquivo
          <input ref={fileRef} required type="file" />
        </label>
        <label>
          Observacao
          <input
            onChange={(event) => setObservacao(event.target.value)}
            type="text"
            value={observacao}
          />
        </label>
        <button className="secondary-button" disabled={loading} type="submit">
          Anexar
        </button>
      </form>

      <div className="document-list">
        {arquivos.length ? (
          arquivos.map((arquivo) => (
            <article className="document-row" key={getArquivoId(arquivo, origem)}>
              <div>
                <strong>{arquivo.nome_original}</strong>
                <span>
                  {arquivo.tipoDocumento?.nome || 'Documento'} - {tamanhoArquivo(arquivo.tamanho)}
                </span>
              </div>
              <div className="row-actions">
                <button
                  className="ghost-button"
                  onClick={() => baixar(arquivo)}
                  type="button"
                >
                  Baixar
                </button>
                <button
                  className="secondary-button"
                  disabled={loading}
                  onClick={() => remover(arquivo)}
                  type="button"
                >
                  Remover
                </button>
              </div>
            </article>
          ))
        ) : (
          <p className="empty-state">
            {loading ? 'Carregando anexos...' : 'Nenhum anexo cadastrado.'}
          </p>
        )}
      </div>
    </section>
  )
}

export default DocumentosPanel
