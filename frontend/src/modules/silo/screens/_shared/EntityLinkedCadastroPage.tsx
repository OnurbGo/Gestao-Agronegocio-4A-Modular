import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import EntityLinkedFields from '@/shared/components/references/EntityLinkedFields'
import { getEntidadeDocumento } from '@/shared/components/references/reference-formatters'
import StatusMessage from '@/shared/components/feedback/StatusMessage'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { Textarea } from '@/shared/components/ui/textarea'
import { canCreate, canEdit } from '@/shared/services/auth.service'
import { normalizePaginated } from '@/shared/services/api'
import type {
  AuthUser,
  CadastroAuxiliar,
  EntidadeReferencia,
  PaginatedResponse,
  QueryParams,
  StatusMessageState,
} from '@/shared/types'
import EmptyState from './EmptyState'
import PageHeader from './PageHeader'
import ScreenSection from './ScreenSection'

type EntityLinkedCadastroForm = {
  entidade_id_ref: string
  nome: string
  documento: string
  telefone: string
  observacao: string
  ativo: boolean
}

type EntityLinkedCadastroApi<TItem extends CadastroAuxiliar> = {
  list: (params?: QueryParams) => Promise<PaginatedResponse<TItem> | TItem[]>
  create: (payload: Record<string, unknown>) => Promise<TItem>
  update: (id: number, payload: Record<string, unknown>) => Promise<TItem>
  remove: (id: number) => Promise<unknown>
}

type EntityLinkedCadastroPageProps<TItem extends CadastroAuxiliar> = {
  usuario: AuthUser
  title: string
  description: string
  api: EntityLinkedCadastroApi<TItem>
  idFrom: (item: TItem) => number
  moduleId?: string
  statusField: 'ativo' | 'ativa'
  hasTelefone?: boolean
  linkedHelp?: string
}

const PAGE_SIZE = 20
const emptyForm: EntityLinkedCadastroForm = {
  entidade_id_ref: '',
  nome: '',
  documento: '',
  telefone: '',
  observacao: '',
  ativo: true,
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Não foi possível concluir.'
}

function normalizeForm(item?: CadastroAuxiliar | null): EntityLinkedCadastroForm {
  return {
    entidade_id_ref: item?.entidade_id_ref ? String(item.entidade_id_ref) : '',
    nome: item?.nome || '',
    documento: item?.documento || '',
    telefone: item?.telefone || '',
    observacao: item?.observacao || item?.descricao || '',
    ativo: item?.ativo !== false && item?.ativa !== false,
  }
}

function buildPayload(
  form: EntityLinkedCadastroForm,
  statusField: 'ativo' | 'ativa',
  hasTelefone: boolean,
) {
  return {
    entidade_id_ref: form.entidade_id_ref ? Number(form.entidade_id_ref) : null,
    nome: form.nome.trim(),
    documento: form.documento.trim() || null,
    telefone: hasTelefone ? form.telefone.trim() || null : undefined,
    observacao: form.observacao.trim() || null,
    [statusField]: form.ativo,
  }
}

function EntityLinkedCadastroPage<TItem extends CadastroAuxiliar>({
  usuario,
  title,
  description,
  api,
  idFrom,
  moduleId = 'SILO',
  statusField,
  hasTelefone,
  linkedHelp,
}: EntityLinkedCadastroPageProps<TItem>) {
  const [items, setItems] = useState<TItem[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedEntidade, setSelectedEntidade] =
    useState<EntidadeReferencia | null>(null)
  const [form, setForm] = useState<EntityLinkedCadastroForm>(emptyForm)
  const [termo, setTermo] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<StatusMessageState>(null)

  const selected = useMemo(
    () => items.find((item) => idFrom(item) === selectedId),
    [idFrom, items, selectedId],
  )
  const mayCreate = canCreate(usuario, moduleId)
  const mayEdit = canEdit(usuario, moduleId)
  const canSave = selectedId ? mayEdit : mayCreate

  async function loadItems(nextPage = page) {
    setLoading(true)
    setStatus(null)

    try {
      const response = await api.list({
        search: termo || undefined,
        termo: termo || undefined,
        nome: termo || undefined,
        page: nextPage,
        limit: PAGE_SIZE,
      })
      const normalized = normalizePaginated(response, PAGE_SIZE)
      setItems(normalized.items)
      setPage(normalized.page)
      setTotalPages(normalized.totalPages)
      setTotal(normalized.total)
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadItems(1)
  }, [])

  function selectItem(item: TItem) {
    setSelectedId(idFrom(item))
    setSelectedEntidade(null)
    setForm(normalizeForm(item))
    setStatus(null)
  }

  function newItem() {
    setSelectedId(null)
    setSelectedEntidade(null)
    setForm(emptyForm)
    setStatus(null)
  }

  function selectEntidade(entidade: EntidadeReferencia) {
    setSelectedEntidade(entidade)
    setForm((current) => ({
      ...current,
      entidade_id_ref: String(entidade.id_entidade),
      nome: entidade.nome || current.nome,
      documento: getEntidadeDocumento(entidade) || current.documento,
      telefone: entidade.telefone || entidade.celular || current.telefone,
    }))
  }

  function clearEntidade() {
    setSelectedEntidade(null)
    setForm((current) => ({ ...current, entidade_id_ref: '' }))
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSave) {
      setStatus({ type: 'warning', message: 'Sem permissão para salvar.' })
      return
    }

    setLoading(true)
    setStatus(null)

    try {
      const saved = selectedId
        ? await api.update(selectedId, buildPayload(form, statusField, Boolean(hasTelefone)))
        : await api.create(buildPayload(form, statusField, Boolean(hasTelefone)))
      setSelectedId(idFrom(saved))
      setForm(normalizeForm(saved))
      setStatus({ type: 'success', message: 'Cadastro salvo.' })
      await loadItems(page)
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  async function removeSelected() {
    if (!selectedId || !mayEdit) return
    const confirmed = window.confirm(`Desativar ${title.toLowerCase()} selecionado?`)
    if (!confirmed) return

    setLoading(true)
    setStatus(null)

    try {
      await api.remove(selectedId)
      newItem()
      setStatus({ type: 'success', message: 'Cadastro removido ou desativado.' })
      await loadItems(1)
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="px-4 py-6 sm:px-6">
      <PageHeader
        actions={
          <Button disabled={!mayCreate} onClick={newItem} type="button">
            Novo
          </Button>
        }
        description={description}
        title={title}
      />

      {linkedHelp ? (
        <p className="mb-5 rounded-md border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
          {linkedHelp}
        </p>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_460px]">
        <ScreenSection
          actions={
            <>
              <Input
                className="w-full sm:w-64"
                onChange={(event) => setTermo(event.target.value)}
                placeholder="Pesquisar nome ou documento"
                value={termo}
              />
              <Button
                disabled={loading}
                onClick={() => void loadItems(1)}
                type="button"
                variant="outline"
              >
                Filtrar
              </Button>
            </>
          }
          title="Registros"
        >
          {items.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Documento</TableHead>
                  {hasTelefone ? <TableHead>Telefone</TableHead> : null}
                  <TableHead className="hidden md:table-cell">Vínculo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const itemId = idFrom(item)
                  const active = statusField === 'ativa' ? item.ativa : item.ativo
                  return (
                    <TableRow
                      className={selectedId === itemId ? 'bg-emerald-50' : undefined}
                      key={itemId}
                      onClick={() => selectItem(item)}
                    >
                      <TableCell className="font-semibold">{item.nome || '-'}</TableCell>
                      <TableCell>{item.documento || '-'}</TableCell>
                      {hasTelefone ? <TableCell>{item.telefone || '-'}</TableCell> : null}
                      <TableCell className="hidden md:table-cell">
                        {item.entidade_id_ref ? `Entidade ${item.entidade_id_ref}` : 'Avulso'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={active === false ? 'secondary' : 'default'}>
                          {active === false ? 'Inativo' : 'Ativo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState title={loading ? 'Carregando registros...' : undefined} />
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
            <span>
              {total} registro(s), página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                disabled={loading || page <= 1}
                onClick={() => void loadItems(page - 1)}
                type="button"
                variant="outline"
              >
                Anterior
              </Button>
              <Button
                disabled={loading || page >= totalPages}
                onClick={() => void loadItems(page + 1)}
                type="button"
                variant="outline"
              >
                Próxima
              </Button>
            </div>
          </div>
        </ScreenSection>

        <ScreenSection title={selected ? selected.nome || 'Editar' : 'Novo'}>
          <form className="grid gap-4" onSubmit={save}>
            <EntityLinkedFields
              documento={form.documento}
              entidade={selectedEntidade}
              entidadeId={
                form.entidade_id_ref ? Number(form.entidade_id_ref) : null
              }
              nome={form.nome}
              onChangeDocumento={(value) =>
                setForm((current) => ({ ...current, documento: value }))
              }
              onChangeNome={(value) =>
                setForm((current) => ({ ...current, nome: value }))
              }
              onClearEntidade={clearEntidade}
              onSelectEntidade={selectEntidade}
            />

            {hasTelefone ? (
              <div>
                <Label>Telefone</Label>
                <Input
                  className="mt-2"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, telefone: event.target.value }))
                  }
                  value={form.telefone}
                />
              </div>
            ) : null}

            <div>
              <Label>Observação</Label>
              <Textarea
                className="mt-2"
                onChange={(event) =>
                  setForm((current) => ({ ...current, observacao: event.target.value }))
                }
                value={form.observacao}
              />
            </div>

            <label className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700">
              <input
                checked={form.ativo}
                className="h-4 w-4 accent-emerald-700"
                onChange={(event) =>
                  setForm((current) => ({ ...current, ativo: event.target.checked }))
                }
                type="checkbox"
              />
              Cadastro ativo
            </label>

            <StatusMessage status={status} />

            <div className="flex flex-wrap gap-2">
              <Button disabled={loading || !canSave} type="submit">
                Salvar
              </Button>
              <Button onClick={newItem} type="button" variant="outline">
                Limpar
              </Button>
              {selectedId ? (
                <Button
                  disabled={loading || !mayEdit}
                  onClick={() => void removeSelected()}
                  type="button"
                  variant="destructive"
                >
                  Desativar
                </Button>
              ) : null}
            </div>
          </form>
        </ScreenSection>
      </div>
    </section>
  )
}

export default EntityLinkedCadastroPage
