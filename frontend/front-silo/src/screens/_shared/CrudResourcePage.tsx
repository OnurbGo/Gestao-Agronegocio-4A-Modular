import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import StatusMessage from '@/components/feedback/StatusMessage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { canCreate, canEdit } from '@/services/auth.service'
import { normalizePaginated } from '@/services/api'
import type {
  AuthUser,
  PaginatedResponse,
  QueryParams,
  StatusMessageState,
} from '@/types'
import EmptyState from './EmptyState'
import PageHeader from './PageHeader'
import ScreenSection from './ScreenSection'

export type CrudField<TForm> = {
  name: keyof TForm
  label: string
  type?: 'text' | 'number' | 'textarea' | 'checkbox' | 'select'
  required?: boolean
  placeholder?: string
  options?: Array<{ value: string | number | boolean; label: string }>
  className?: string
}

export type CrudColumn<TItem> = {
  header: string
  render: (item: TItem) => ReactNode
  className?: string
}

type ResourceApi<TItem> = {
  list: (params?: QueryParams) => Promise<PaginatedResponse<TItem> | TItem[]>
  create: (payload: Record<string, unknown>) => Promise<TItem>
  update: (id: number, payload: Record<string, unknown>) => Promise<TItem>
  remove?: (id: number) => Promise<unknown>
}

type CrudResourcePageProps<TItem, TForm extends Record<string, unknown>> = {
  title: string
  description: string
  usuario: AuthUser
  moduleId?: string
  api: ResourceApi<TItem>
  idFrom: (item: TItem) => number
  rowTitle: (item: TItem) => string
  emptyForm: TForm
  fields: Array<CrudField<TForm>>
  columns: Array<CrudColumn<TItem>>
  buildPayload: (form: TForm) => Record<string, unknown>
  normalizeForm: (item?: TItem | null) => TForm
  defaultFilters?: QueryParams
}

const PAGE_SIZE = 20

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Nao foi possivel concluir.'
}

function renderBooleanStatus(value: unknown) {
  const enabled = value !== false
  return (
    <Badge variant={enabled ? 'default' : 'secondary'}>
      {enabled ? 'Ativo' : 'Inativo'}
    </Badge>
  )
}

function CrudResourcePage<TItem, TForm extends Record<string, unknown>>({
  title,
  description,
  usuario,
  moduleId = 'SILO',
  api,
  idFrom,
  rowTitle,
  emptyForm,
  fields,
  columns,
  buildPayload,
  normalizeForm,
  defaultFilters = {},
}: CrudResourcePageProps<TItem, TForm>) {
  const [items, setItems] = useState<TItem[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [form, setForm] = useState<TForm>(emptyForm)
  const [termo, setTermo] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(() =>
    normalizePaginated<TItem>([], PAGE_SIZE),
  )
  const [status, setStatus] = useState<StatusMessageState>(null)
  const [loading, setLoading] = useState(false)

  const selected = useMemo(
    () => items.find((item) => idFrom(item) === selectedId),
    [idFrom, items, selectedId],
  )
  const mayCreate = canCreate(usuario, moduleId)
  const mayEdit = canEdit(usuario, moduleId)
  const canSave = selectedId ? mayEdit : mayCreate

  async function load(nextPage = page) {
    setLoading(true)
    setStatus(null)

    try {
      const response = await api.list({
        ...defaultFilters,
        termo: termo || undefined,
        nome: termo || undefined,
        ativo: statusFilter === '' ? undefined : statusFilter === 'ativo',
        ativa: statusFilter === '' ? undefined : statusFilter === 'ativo',
        page: nextPage,
        limit: PAGE_SIZE,
      })
      const normalized = normalizePaginated(response, PAGE_SIZE)
      setItems(normalized.items)
      setMeta(normalized)
      setPage(normalized.page)

      if (selectedId && !normalized.items.some((item) => idFrom(item) === selectedId)) {
        setSelectedId(null)
        setForm(emptyForm)
      }
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(1)
  }, [])

  function selectItem(item: TItem) {
    setSelectedId(idFrom(item))
    setForm(normalizeForm(item))
    setStatus(null)
  }

  function newItem() {
    setSelectedId(null)
    setForm(emptyForm)
    setStatus(null)
  }

  function updateField(field: keyof TForm, value: unknown) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSave) {
      setStatus({ type: 'warning', message: 'Sem permissao para salvar.' })
      return
    }

    setLoading(true)
    setStatus(null)

    try {
      const payload = buildPayload(form)
      const saved = selectedId
        ? await api.update(selectedId, payload)
        : await api.create(payload)
      const savedId = idFrom(saved)
      setSelectedId(savedId)
      setForm(normalizeForm(saved))
      setStatus({ type: 'success', message: 'Registro salvo.' })
      await load(page)
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  async function removeSelected() {
    if (!selectedId || !api.remove || !mayEdit) return

    const confirmed = window.confirm('Confirmar remocao ou desativacao deste registro?')
    if (!confirmed) return

    setLoading(true)
    setStatus(null)

    try {
      await api.remove(selectedId)
      setSelectedId(null)
      setForm(emptyForm)
      setStatus({ type: 'success', message: 'Registro removido ou desativado.' })
      await load(1)
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="px-4 py-6 sm:px-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button disabled={!mayCreate} onClick={newItem} type="button">
            Novo
          </Button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <ScreenSection
          title="Registros"
          actions={
            <>
              <Input
                className="w-full sm:w-64"
                onChange={(event) => setTermo(event.target.value)}
                placeholder="Pesquisar"
                value={termo}
              />
              <select
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm"
                onChange={(event) => setStatusFilter(event.target.value)}
                value={statusFilter}
              >
                <option value="">Todos</option>
                <option value="ativo">Ativos</option>
                <option value="inativo">Inativos</option>
              </select>
              <Button disabled={loading} onClick={() => void load(1)} type="button" variant="outline">
                Filtrar
              </Button>
            </>
          }
        >
          {items.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead className={column.className} key={column.header}>
                      {column.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const itemId = idFrom(item)
                  const active = itemId === selectedId
                  return (
                    <TableRow
                      className={active ? 'bg-emerald-50' : undefined}
                      key={itemId}
                      onClick={() => selectItem(item)}
                    >
                      {columns.map((column) => (
                        <TableCell className={column.className} key={column.header}>
                          {column.render(item)}
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState />
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
            <span>
              {meta.total} registro(s), pagina {meta.page} de {meta.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                disabled={loading || page <= 1}
                onClick={() => void load(page - 1)}
                type="button"
                variant="outline"
              >
                Anterior
              </Button>
              <Button
                disabled={loading || page >= meta.totalPages}
                onClick={() => void load(page + 1)}
                type="button"
                variant="outline"
              >
                Proxima
              </Button>
            </div>
          </div>
        </ScreenSection>

        <ScreenSection title={selected ? rowTitle(selected) : 'Novo registro'}>
          <form className="grid gap-4" onSubmit={save}>
            {fields.map((field) => {
              const rawValue = form[field.name]
              const value = rawValue === null || rawValue === undefined ? '' : String(rawValue)

              if (field.type === 'checkbox') {
                return (
                  <label
                    className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700"
                    key={String(field.name)}
                  >
                    <Checkbox
                      checked={Boolean(rawValue)}
                      onCheckedChange={(checked) => updateField(field.name, Boolean(checked))}
                    />
                    {field.label}
                  </label>
                )
              }

              return (
                <div className={field.className} key={String(field.name)}>
                  <Label>
                    {field.label}
                    {field.required ? <span className="text-red-600"> *</span> : null}
                  </Label>
                  {field.type === 'textarea' ? (
                    <Textarea
                      className="mt-2"
                      onChange={(event) => updateField(field.name, event.target.value)}
                      placeholder={field.placeholder}
                      value={value}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm"
                      onChange={(event) => updateField(field.name, event.target.value)}
                      value={value}
                    >
                      <option value="">Selecione</option>
                      {field.options?.map((option) => (
                        <option key={String(option.value)} value={String(option.value)}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      className="mt-2"
                      onChange={(event) => updateField(field.name, event.target.value)}
                      placeholder={field.placeholder}
                      required={field.required}
                      type={field.type || 'text'}
                      value={value}
                    />
                  )}
                </div>
              )
            })}

            <StatusMessage status={status} />

            <div className="flex flex-wrap gap-2">
              <Button disabled={loading || !canSave} type="submit">
                Salvar
              </Button>
              <Button onClick={newItem} type="button" variant="outline">
                Limpar
              </Button>
              {selectedId && api.remove ? (
                <Button
                  disabled={loading || !mayEdit}
                  onClick={removeSelected}
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

export { renderBooleanStatus }
export default CrudResourcePage
