import { useEffect, useRef, useState } from 'react'
import {
  Download,
  Eye,
  File,
  FileImage,
  FileText,
  Info,
  Paperclip,
  Trash2,
  UploadCloud,
} from 'lucide-react'
import StatusMessage from '@/shared/components/feedback/StatusMessage'
import {
  baixarArquivo,
  enviarArquivoEntidade,
  enviarArquivoImovel,
  listarArquivosEntidade,
  listarArquivosImovel,
  listarTiposDocumento,
  removerArquivo,
  visualizarArquivo,
} from '@/modules/documentos/services/documentos.service'

function getArquivoId(arquivo, origem) {
  return origem === 'ENTIDADE'
    ? arquivo.id_entidade_arquivo
    : arquivo.id_imovel_arquivo
}

function tamanhoArquivo(bytes = 0) {
  if (!bytes) return '0 KB'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatarData(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function IconeArquivo({ mime = '' }) {
  if (mime === 'application/pdf') return <FileText size={20} />
  if (mime.startsWith('image/')) return <FileImage size={20} />
  if (mime.startsWith('text/')) return <FileText size={20} />
  return <File size={20} />
}

function DocumentosPanel({ origem, ownerId }) {
  const [tipos, setTipos] = useState([])
  const [arquivos, setArquivos] = useState([])
  const [tipoDocumentoId, setTipoDocumentoId] = useState('')
  const [observacao, setObservacao] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [removendoId, setRemovendoId] = useState(null)
  const fileRef = useRef(null)

  useEffect(() => {
    if (!ownerId) return

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
        setTipoDocumentoId(
          (current) => current || loadedTipos[0]?.id_tipo_documento || '',
        )
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
      setTipoDocumentoId(
        (current) => current || loadedTipos[0]?.id_tipo_documento || '',
      )
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  function selecionarArquivos(fileList) {
    setSelectedFiles(Array.from(fileList || []))
  }

  function handleDrag(event) {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(event.type === 'dragenter' || event.type === 'dragover')
  }

  function handleDrop(event) {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(false)
    selecionarArquivos(event.dataTransfer.files)
  }

  async function enviar(event) {
    event.preventDefault()

    const arquivosSelecionados = selectedFiles.length
      ? selectedFiles
      : Array.from(fileRef.current?.files || [])

    if (!arquivosSelecionados.length) {
      setStatus({ type: 'warning', message: 'Selecione ao menos um arquivo.' })
      return
    }

    setLoading(true)
    setStatus(null)

    try {
      for (const arquivo of arquivosSelecionados) {
        const formData = new FormData()
        formData.append('tipo_documento_id', tipoDocumentoId)
        formData.append('observacao', observacao)
        formData.append('arquivo', arquivo)

        if (origem === 'ENTIDADE') {
          await enviarArquivoEntidade(ownerId, formData)
        } else {
          await enviarArquivoImovel(ownerId, formData)
        }
      }

      setObservacao('')
      setSelectedFiles([])
      if (fileRef.current) fileRef.current.value = ''
      setStatus({
        type: 'success',
        message:
          arquivosSelecionados.length === 1
            ? 'Arquivo anexado.'
            : `${arquivosSelecionados.length} arquivos anexados.`,
      })
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

  async function visualizar(arquivo) {
    try {
      await visualizarArquivo(getArquivoId(arquivo, origem), origem, arquivo.nome_original)
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    }
  }

  async function remover(arquivo) {
    const id = getArquivoId(arquivo, origem)
    setRemovendoId(id)
    setStatus(null)

    try {
      await removerArquivo(id, origem)
      setStatus({ type: 'success', message: 'Arquivo removido.' })
      await carregar()
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setRemovendoId(null)
    }
  }

  if (!ownerId) {
    return (
      <section className="panel docs-panel">
        <div className="panel-heading">
          <h2>Anexos</h2>
        </div>
        <div className="docs-empty-state docs-save-first">
          <Info size={32} />
          <p>Salve o cadastro antes de anexar documentos.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="panel docs-panel">
      <div className="panel-heading">
        <h2>Anexos</h2>
        {arquivos.length > 0 && (
          <span className="docs-count">{arquivos.length}</span>
        )}
      </div>

      <StatusMessage status={status} />

      <form className="docs-upload-form" onSubmit={enviar}>
        <label
          className={`docs-dropzone ${dragActive ? 'docs-dropzone--active' : ''} ${selectedFiles.length ? 'docs-dropzone--has-files' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <UploadCloud size={32} className="docs-dropzone-icon" />
          <span className="docs-dropzone-title">
            {selectedFiles.length
              ? selectedFiles.map((f) => f.name).join(', ')
              : 'Arraste arquivos aqui'}
          </span>
          <span className="docs-dropzone-hint">
            {selectedFiles.length ? '' : 'ou clique para selecionar'}
          </span>
          <input
            ref={fileRef}
            multiple
            onChange={(event) => selecionarArquivos(event.target.files)}
            type="file"
          />
        </label>

        <div className="docs-form-row">
          <label className="docs-form-field">
            Tipo de documento
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
          <label className="docs-form-field">
            Observação
            <input
              onChange={(event) => setObservacao(event.target.value)}
              placeholder="Opcional"
              type="text"
              value={observacao}
            />
          </label>
        </div>

        <button className="primary-button docs-submit-btn" disabled={loading} type="submit">
          <Paperclip size={15} />
          Anexar
        </button>
      </form>

      <div className="docs-list">
        {arquivos.length ? (
          arquivos.map((arquivo) => {
            const id = getArquivoId(arquivo, origem)
            const removendo = removendoId === id
            return (
              <div className="docs-card" key={id}>
                <div className="docs-card-icon">
                  <IconeArquivo mime={arquivo.tipo_mime} />
                </div>
                <div className="docs-card-body">
                  <strong className="docs-card-name">{arquivo.nome_original}</strong>
                  <div className="docs-card-meta">
                    {arquivo.tipoDocumento?.nome && (
                      <span className="docs-badge">{arquivo.tipoDocumento.nome}</span>
                    )}
                    <span className="docs-meta-info">{tamanhoArquivo(arquivo.tamanho)}</span>
                    {arquivo.createdAt && (
                      <span className="docs-meta-info">{formatarData(arquivo.createdAt)}</span>
                    )}
                  </div>
                  {arquivo.observacao && (
                    <p className="docs-card-obs">{arquivo.observacao}</p>
                  )}
                </div>
                <div className="docs-card-actions">
                  <button
                    className="docs-action-btn"
                    onClick={() => visualizar(arquivo)}
                    title="Visualizar"
                    type="button"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    className="docs-action-btn"
                    onClick={() => baixar(arquivo)}
                    title="Baixar"
                    type="button"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    className="docs-action-btn docs-action-btn--danger"
                    disabled={removendo}
                    onClick={() => remover(arquivo)}
                    title="Remover"
                    type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          })
        ) : (
          <div className="docs-empty-state">
            {loading ? (
              <p>Carregando anexos...</p>
            ) : (
              <>
                <File size={32} />
                <p>Nenhum documento anexado.</p>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default DocumentosPanel
