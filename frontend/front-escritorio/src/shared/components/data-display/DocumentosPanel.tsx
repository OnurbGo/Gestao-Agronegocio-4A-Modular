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
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { cn } from '@/shared/utils/cn'
import { formatDateBR } from '@/shared/utils/date'
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

function IconeArquivo({ mime = '' }) {
  if (mime === 'application/pdf') return <FileText className="h-5 w-5" />
  if (mime.startsWith('image/')) return <FileImage className="h-5 w-5" />
  if (mime.startsWith('text/')) return <FileText className="h-5 w-5" />
  return <File className="h-5 w-5" />
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
      <Card className="border-emerald-100">
        <CardHeader>
          <CardTitle>Anexos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid min-h-28 place-items-center gap-3 rounded-lg border border-dashed border-emerald-100 bg-emerald-50/40 p-5 text-center text-emerald-900">
            <Info className="h-8 w-8" />
            <p className="m-0 text-sm font-semibold">
              Salve o cadastro antes de anexar documentos.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-emerald-100">
      <CardHeader className="flex-row items-center justify-between gap-3">
        <CardTitle>Anexos</CardTitle>
        {arquivos.length > 0 ? <Badge>{arquivos.length}</Badge> : null}
      </CardHeader>
      <CardContent className="grid gap-4">
        <StatusMessage status={status} />

        <form
          className="grid gap-3 rounded-lg border border-emerald-100 bg-emerald-50/30 p-4"
          onSubmit={enviar}
        >
          <label
            className={cn(
              'grid min-h-28 cursor-pointer place-items-center gap-2 rounded-lg border-2 border-dashed border-emerald-200 bg-white p-5 text-center transition',
              dragActive && 'border-emerald-700 bg-emerald-50',
              selectedFiles.length && 'border-emerald-700 border-solid',
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <UploadCloud className="h-8 w-8 text-emerald-700" />
            <span className="max-w-full truncate text-sm font-bold text-emerald-900">
              {selectedFiles.length
                ? selectedFiles.map((f) => f.name).join(', ')
                : 'Arraste arquivos aqui'}
            </span>
            {!selectedFiles.length ? (
              <span className="text-xs font-semibold text-slate-500">
                ou clique para selecionar
              </span>
            ) : null}
            <input
              ref={fileRef}
              className="hidden"
              multiple
              onChange={(event) => selecionarArquivos(event.target.files)}
              type="file"
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-bold text-slate-700">
              Tipo de documento
              <select
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100"
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
            <label className="grid gap-1.5 text-sm font-bold text-slate-700">
              Observação
              <Input
                onChange={(event) => setObservacao(event.target.value)}
                placeholder="Opcional"
                type="text"
                value={observacao}
              />
            </label>
          </div>

          <Button className="justify-self-start" disabled={loading} type="submit">
            <Paperclip className="h-4 w-4" />
            Anexar
          </Button>
        </form>

        <div className="grid gap-2">
          {arquivos.length ? (
            arquivos.map((arquivo) => {
              const id = getArquivoId(arquivo, origem)
              const removendo = removendoId === id
              return (
                <article
                  className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-white p-3"
                  key={id}
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-800">
                    <IconeArquivo mime={arquivo.tipo_mime} />
                  </div>
                  <div className="grid min-w-0 flex-1 gap-1">
                    <strong className="truncate text-sm text-slate-950">
                      {arquivo.nome_original}
                    </strong>
                    <div className="flex flex-wrap items-center gap-2">
                      {arquivo.tipoDocumento?.nome ? (
                        <Badge variant="secondary">{arquivo.tipoDocumento.nome}</Badge>
                      ) : null}
                      <span className="text-xs font-semibold text-slate-500">
                        {tamanhoArquivo(arquivo.tamanho)}
                      </span>
                      {arquivo.createdAt ? (
                        <span className="text-xs font-semibold text-slate-500">
                          {formatDateBR(arquivo.createdAt)}
                        </span>
                      ) : null}
                    </div>
                    {arquivo.observacao ? (
                      <p className="m-0 truncate text-xs text-slate-500">
                        {arquivo.observacao}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      onClick={() => visualizar(arquivo)}
                      size="icon"
                      title="Visualizar"
                      type="button"
                      variant="secondary"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => baixar(arquivo)}
                      size="icon"
                      title="Baixar"
                      type="button"
                      variant="secondary"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      disabled={removendo}
                      onClick={() => remover(arquivo)}
                      size="icon"
                      title="Remover"
                      type="button"
                      variant="destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </article>
              )
            })
          ) : (
            <div className="grid min-h-28 place-items-center gap-3 rounded-lg border border-dashed border-emerald-100 p-5 text-center text-slate-500">
              {loading ? (
                <p className="m-0 text-sm font-semibold">Carregando anexos...</p>
              ) : (
                <>
                  <File className="h-8 w-8" />
                  <p className="m-0 text-sm font-semibold">
                    Nenhum documento anexado.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default DocumentosPanel
