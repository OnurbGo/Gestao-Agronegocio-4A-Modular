import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import StatusMessage from '@/components/feedback/StatusMessage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { normalizePaginated } from '@/services/api'
import { contasProdutoApi, contratosApi, itensApi } from '@/services/silo.service'
import type {
  AuthUser,
  ContaProduto,
  ContratoSilo,
  ItemSilo,
  StatusMessageState,
} from '@/types'
import { asText, formatKg } from '@/utils/formatters'
import EmptyState from '@/screens/_shared/EmptyState'
import PageHeader from '@/screens/_shared/PageHeader'
import ScreenSection from '@/screens/_shared/ScreenSection'

type ContratosPageProps = {
  usuario: AuthUser
}

type ContratoForm = {
  numero_contrato: string
  conta_produto_id: string
  item_id: string
  comprador_entidade_id_ref: string
  comprador_nome_cache: string
  quantidade_contratada_kg: string
  data_contrato: string
  observacao: string
}

const PAGE_SIZE = 20
const emptyForm: ContratoForm = {
  numero_contrato: '',
  conta_produto_id: '',
  item_id: '',
  comprador_entidade_id_ref: '',
  comprador_nome_cache: '',
  quantidade_contratada_kg: '',
  data_contrato: '',
  observacao: '',
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Nao foi possivel concluir.'
}

function optionalNumber(value: string) {
  return value ? Number(value) : null
}

function normalizeForm(contrato?: ContratoSilo | null): ContratoForm {
  return {
    numero_contrato: contrato?.numero_contrato || '',
    conta_produto_id: contrato?.conta_produto_id ? String(contrato.conta_produto_id) : '',
    item_id: contrato?.item_id ? String(contrato.item_id) : '',
    comprador_entidade_id_ref: contrato?.comprador_entidade_id_ref
      ? String(contrato.comprador_entidade_id_ref)
      : '',
    comprador_nome_cache: contrato?.comprador_nome_cache || '',
    quantidade_contratada_kg: contrato?.quantidade_contratada_kg
      ? String(contrato.quantidade_contratada_kg)
      : '',
    data_contrato: contrato?.data_contrato ? String(contrato.data_contrato).slice(0, 10) : '',
    observacao: contrato?.observacao || '',
  }
}

function buildPayload(form: ContratoForm) {
  return {
    numero_contrato: form.numero_contrato.trim(),
    conta_produto_id: Number(form.conta_produto_id),
    item_id: Number(form.item_id),
    comprador_entidade_id_ref: optionalNumber(form.comprador_entidade_id_ref),
    comprador_nome_cache: form.comprador_nome_cache.trim() || null,
    quantidade_contratada_kg: Number(form.quantidade_contratada_kg),
    data_contrato: form.data_contrato || null,
    observacao: form.observacao.trim() || null,
  }
}

function ContratosPage({ usuario }: ContratosPageProps) {
  const [contratos, setContratos] = useState<ContratoSilo[]>([])
  const [contas, setContas] = useState<ContaProduto[]>([])
  const [itens, setItens] = useState<ItemSilo[]>([])
  const [selected, setSelected] = useState<ContratoSilo | null>(null)
  const [form, setForm] = useState<ContratoForm>(emptyForm)
  const [filters, setFilters] = useState({ termo: '', status: '' })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<StatusMessageState>(null)

  const canManage = Boolean(usuario.possuiAdmin || usuario.possuiGerente)

  async function loadOptions() {
    const [loadedContas, loadedItens] = await Promise.all([
      contasProdutoApi.list({ limit: 100 }),
      itensApi.list({ limit: 100 }),
    ])
    setContas(normalizePaginated(loadedContas, 100).items)
    setItens(normalizePaginated(loadedItens, 100).items)
  }

  async function loadContratos(nextPage = page) {
    setLoading(true)
    setStatus(null)

    try {
      const response = await contratosApi.list({
        termo: filters.termo || undefined,
        numero_contrato: filters.termo || undefined,
        status: filters.status || undefined,
        page: nextPage,
        limit: PAGE_SIZE,
      })
      const normalized = normalizePaginated(response, PAGE_SIZE)
      setContratos(normalized.items)
      setPage(normalized.page)
      setTotalPages(normalized.totalPages)
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadOptions()
    void loadContratos(1)
  }, [])

  async function selectContrato(contrato: ContratoSilo) {
    setLoading(true)
    setStatus(null)

    try {
      const detailed = await contratosApi.get(contrato.id_contrato)
      setSelected(detailed)
      setForm(normalizeForm(detailed))
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  function newContrato() {
    setSelected(null)
    setForm(emptyForm)
    setStatus(null)
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canManage) {
      setStatus({ type: 'warning', message: 'Contratos sao restritos a Gerente/Admin.' })
      return
    }

    setLoading(true)
    setStatus(null)

    try {
      const saved = selected
        ? await contratosApi.update(selected.id_contrato, buildPayload(form))
        : await contratosApi.create(buildPayload(form))
      setSelected(saved)
      setForm(normalizeForm(saved))
      setStatus({ type: 'success', message: 'Contrato salvo.' })
      await loadContratos(page)
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  async function cancelar() {
    if (!selected || !canManage) return
    const justificativa = window.prompt('Informe a justificativa para cancelar o contrato')
    if (!justificativa) return

    setLoading(true)
    setStatus(null)

    try {
      const canceled = await contratosApi.cancelar(selected.id_contrato, justificativa)
      setSelected(canceled)
      setForm(normalizeForm(canceled))
      setStatus({ type: 'success', message: 'Contrato cancelado.' })
      await loadContratos(page)
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="px-4 py-6 sm:px-6">
      <PageHeader
        title="Contratos"
        description="Contrato formal opcional para saidas e embarques, com gestao restrita."
        actions={<Button disabled={!canManage} onClick={newContrato} type="button">Novo contrato</Button>}
      />

      <StatusMessage status={status} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_460px]">
        <ScreenSection
          title="Consulta"
          actions={<Button disabled={loading} onClick={() => void loadContratos(1)} type="button" variant="outline">Filtrar</Button>}
        >
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <Input onChange={(event) => setFilters((current) => ({ ...current, termo: event.target.value }))} placeholder="Numero ou comprador" value={filters.termo} />
            <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} value={filters.status}>
              <option value="">Status</option>
              {['ABERTO', 'PARCIAL', 'CONCLUIDO', 'CANCELADO'].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          {contratos.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contratos.map((contrato) => (
                  <TableRow
                    className={selected?.id_contrato === contrato.id_contrato ? 'bg-emerald-50' : undefined}
                    key={contrato.id_contrato}
                    onClick={() => void selectContrato(contrato)}
                  >
                    <TableCell className="font-semibold">{contrato.numero_contrato}</TableCell>
                    <TableCell>{asText(contrato.conta_produto?.nome)}</TableCell>
                    <TableCell>{asText(contrato.item?.nome)}</TableCell>
                    <TableCell>{formatKg(contrato.saldo_kg)}</TableCell>
                    <TableCell><Badge variant={contrato.status === 'CANCELADO' ? 'destructive' : 'outline'}>{contrato.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState title={loading ? 'Carregando contratos...' : undefined} />
          )}
          <div className="mt-4 flex justify-between text-sm text-slate-600">
            <span>Pagina {page} de {totalPages}</span>
            <div className="flex gap-2">
              <Button disabled={page <= 1 || loading} onClick={() => void loadContratos(page - 1)} type="button" variant="outline">Anterior</Button>
              <Button disabled={page >= totalPages || loading} onClick={() => void loadContratos(page + 1)} type="button" variant="outline">Proxima</Button>
            </div>
          </div>
        </ScreenSection>

        <ScreenSection
          title={selected ? 'Editar contrato' : 'Novo contrato'}
          actions={selected ? <Button disabled={!canManage} onClick={() => void cancelar()} type="button" variant="destructive">Cancelar</Button> : null}
        >
          <form className="grid gap-4" onSubmit={save}>
            <div>
              <Label>Numero *</Label>
              <Input className="mt-2" onChange={(event) => setForm((current) => ({ ...current, numero_contrato: event.target.value }))} required value={form.numero_contrato} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Conta *</Label>
                <select className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" onChange={(event) => setForm((current) => ({ ...current, conta_produto_id: event.target.value }))} required value={form.conta_produto_id}>
                  <option value="">Selecione</option>
                  {contas.map((conta) => <option key={conta.id_conta_produto} value={conta.id_conta_produto}>{conta.nome}</option>)}
                </select>
              </div>
              <div>
                <Label>Item *</Label>
                <select className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" onChange={(event) => setForm((current) => ({ ...current, item_id: event.target.value }))} required value={form.item_id}>
                  <option value="">Selecione</option>
                  {itens.map((item) => <option key={item.id_item} value={item.id_item}>{item.nome}</option>)}
                </select>
              </div>
            </div>
            <Input placeholder="Comprador ref." type="number" value={form.comprador_entidade_id_ref} onChange={(event) => setForm((current) => ({ ...current, comprador_entidade_id_ref: event.target.value }))} />
            <Input placeholder="Comprador nome cache" value={form.comprador_nome_cache} onChange={(event) => setForm((current) => ({ ...current, comprador_nome_cache: event.target.value }))} />
            <Input placeholder="Quantidade contratada kg" required type="number" value={form.quantidade_contratada_kg} onChange={(event) => setForm((current) => ({ ...current, quantidade_contratada_kg: event.target.value }))} />
            <Input type="date" value={form.data_contrato} onChange={(event) => setForm((current) => ({ ...current, data_contrato: event.target.value }))} />
            <Textarea placeholder="Observacao" value={form.observacao} onChange={(event) => setForm((current) => ({ ...current, observacao: event.target.value }))} />
            <div className="grid gap-2 rounded-md border border-slate-100 bg-slate-50 p-4 text-sm">
              <span>Entregue: {formatKg(selected?.quantidade_entregue_kg)}</span>
              <span>Saldo: {formatKg(selected?.saldo_kg)}</span>
              <span>Status: {selected?.status || '-'}</span>
            </div>
            <div className="flex gap-2">
              <Button disabled={loading || !canManage} type="submit">Salvar</Button>
              <Button onClick={newContrato} type="button" variant="outline">Limpar</Button>
            </div>
          </form>
        </ScreenSection>
      </div>
    </section>
  )
}

export default ContratosPage
