import { useEffect, useMemo, useState } from 'react'
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
import { canCreate, canEdit } from '@/services/auth.service'
import { normalizePaginated } from '@/services/api'
import {
  contasProdutoApi,
  contratosApi,
  destinosApi,
  itensApi,
  lotesApi,
} from '@/services/silo.service'
import type {
  AuthUser,
  ContaProduto,
  ContratoSilo,
  Destino,
  ItemSilo,
  LoteOperacional,
  StatusMessageState,
} from '@/types'
import { asText, formatKg, formatSacas } from '@/utils/formatters'
import EmptyState from '@/screens/_shared/EmptyState'
import PageHeader from '@/screens/_shared/PageHeader'
import ScreenSection from '@/screens/_shared/ScreenSection'

type LotesOperacionaisPageProps = {
  usuario: AuthUser
}

type LoteForm = {
  nome: string
  tipo: string
  conta_produto_id: string
  item_id: string
  contrato_id: string
  imovel_id_ref: string
  area_lote_id_ref: string
  safra_id_ref: string
  destino_id: string
  observacao: string
}

const PAGE_SIZE = 20
const loteTipos = ['ENTRADA', 'SAIDA', 'EMBARQUE', 'RETIRADA', 'TRANSFERENCIA', 'AJUSTE']
const loteStatus = ['ABERTO', 'EM_ANDAMENTO', 'FECHADO', 'CANCELADO']

const emptyForm: LoteForm = {
  nome: '',
  tipo: 'ENTRADA',
  conta_produto_id: '',
  item_id: '',
  contrato_id: '',
  imovel_id_ref: '',
  area_lote_id_ref: '',
  safra_id_ref: '',
  destino_id: '',
  observacao: '',
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Nao foi possivel concluir.'
}

function optionalNumber(value: string) {
  return value ? Number(value) : null
}

function normalizeForm(lote?: LoteOperacional | null): LoteForm {
  return {
    nome: lote?.nome || '',
    tipo: lote?.tipo || 'ENTRADA',
    conta_produto_id: lote?.conta_produto_id ? String(lote.conta_produto_id) : '',
    item_id: lote?.item_id ? String(lote.item_id) : '',
    contrato_id: lote?.contrato_id ? String(lote.contrato_id) : '',
    imovel_id_ref: lote?.imovel_id_ref ? String(lote.imovel_id_ref) : '',
    area_lote_id_ref: lote?.area_lote_id_ref ? String(lote.area_lote_id_ref) : '',
    safra_id_ref: lote?.safra_id_ref ? String(lote.safra_id_ref) : '',
    destino_id: lote?.destino_id ? String(lote.destino_id) : '',
    observacao: lote?.observacao || '',
  }
}

function buildPayload(form: LoteForm) {
  return {
    nome: form.nome.trim(),
    tipo: form.tipo,
    conta_produto_id: Number(form.conta_produto_id),
    item_id: Number(form.item_id),
    contrato_id: optionalNumber(form.contrato_id),
    imovel_id_ref: optionalNumber(form.imovel_id_ref),
    area_lote_id_ref: optionalNumber(form.area_lote_id_ref),
    safra_id_ref: optionalNumber(form.safra_id_ref),
    destino_id: optionalNumber(form.destino_id),
    observacao: form.observacao.trim() || null,
  }
}

function LotesOperacionaisPage({ usuario }: LotesOperacionaisPageProps) {
  const [lotes, setLotes] = useState<LoteOperacional[]>([])
  const [contas, setContas] = useState<ContaProduto[]>([])
  const [itens, setItens] = useState<ItemSilo[]>([])
  const [destinos, setDestinos] = useState<Destino[]>([])
  const [contratos, setContratos] = useState<ContratoSilo[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selected, setSelected] = useState<LoteOperacional | null>(null)
  const [form, setForm] = useState<LoteForm>(emptyForm)
  const [filters, setFilters] = useState({
    termo: '',
    tipo: '',
    status: '',
    conta_produto_id: '',
    item_id: '',
  })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<StatusMessageState>(null)

  const mayCreate = canCreate(usuario, 'LANCAMENTOS_SILO')
  const mayEdit = canEdit(usuario, 'LANCAMENTOS_SILO')
  const isManager = Boolean(usuario.possuiAdmin || usuario.possuiGerente)
  const canSave = selectedId ? mayEdit : mayCreate

  const selectedPesagens = useMemo(() => selected?.pesagens || [], [selected])

  async function loadOptions() {
    const [loadedContas, loadedItens, loadedDestinos, loadedContratos] = await Promise.all([
      contasProdutoApi.list({ limit: 100 }),
      itensApi.list({ limit: 100 }),
      destinosApi.list({ limit: 100 }),
      contratosApi.list({ limit: 100 }).catch(() => []),
    ])

    setContas(normalizePaginated(loadedContas, 100).items)
    setItens(normalizePaginated(loadedItens, 100).items)
    setDestinos(normalizePaginated(loadedDestinos, 100).items)
    setContratos(normalizePaginated(loadedContratos, 100).items)
  }

  async function loadLotes(nextPage = page) {
    setLoading(true)
    setStatus(null)

    try {
      const response = await lotesApi.list({
        termo: filters.termo || undefined,
        nome: filters.termo || undefined,
        tipo: filters.tipo || undefined,
        status: filters.status || undefined,
        conta_produto_id: filters.conta_produto_id || undefined,
        item_id: filters.item_id || undefined,
        page: nextPage,
        limit: PAGE_SIZE,
      })
      const normalized = normalizePaginated(response, PAGE_SIZE)
      setLotes(normalized.items)
      setPage(normalized.page)
      setTotalPages(normalized.totalPages)
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    async function loadInitial() {
      setLoading(true)
      try {
        await loadOptions()
        if (!active) return
        await loadLotes(1)
      } catch (error) {
        if (active) setStatus({ type: 'error', message: toErrorMessage(error) })
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadInitial()

    return () => {
      active = false
    }
  }, [])

  async function selectLote(lote: LoteOperacional) {
    setLoading(true)
    setStatus(null)

    try {
      const detailed = await lotesApi.get(lote.id_lote_operacional)
      setSelectedId(detailed.id_lote_operacional)
      setSelected(detailed)
      setForm(normalizeForm(detailed))
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  function newLote() {
    setSelectedId(null)
    setSelected(null)
    setForm(emptyForm)
    setStatus(null)
  }

  function updateField(field: keyof LoteForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSave) {
      setStatus({ type: 'warning', message: 'Sem permissao para salvar lote.' })
      return
    }

    setLoading(true)
    setStatus(null)

    try {
      const saved = selectedId
        ? await lotesApi.update(selectedId, buildPayload(form))
        : await lotesApi.create(buildPayload(form))
      setSelectedId(saved.id_lote_operacional)
      setSelected(saved)
      setForm(normalizeForm(saved))
      setStatus({ type: 'success', message: 'Lote salvo.' })
      await loadLotes(page)
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  async function runSensitiveAction(action: 'fechar' | 'reabrir' | 'cancelar') {
    if (!selectedId) return
    if (action !== 'fechar' && !isManager) {
      setStatus({ type: 'warning', message: 'Acao restrita a Gerente ou Admin.' })
      return
    }

    const justificativa =
      action === 'fechar'
        ? window.prompt('Justificativa opcional para fechar o lote') || undefined
        : window.prompt('Informe a justificativa da acao')
    if (action !== 'fechar' && !justificativa) return

    setLoading(true)
    setStatus(null)

    try {
      const updated =
        action === 'fechar'
          ? await lotesApi.fechar(selectedId, justificativa)
          : action === 'reabrir'
            ? await lotesApi.reabrir(selectedId, justificativa || '')
            : await lotesApi.cancelar(selectedId, justificativa || '')
      setSelected(updated)
      setForm(normalizeForm(updated))
      setStatus({ type: 'success', message: 'Acao realizada.' })
      await loadLotes(page)
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="px-4 py-6 sm:px-6">
      <PageHeader
        title="Lotes Operacionais"
        description="Agrupadores operacionais que substituem as planilhas de entrada, saida e embarque."
        actions={
          <Button disabled={!mayCreate} onClick={newLote} type="button">
            Novo lote
          </Button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_460px]">
        <ScreenSection
          title="Consulta"
          actions={
            <Button disabled={loading} onClick={() => void loadLotes(1)} type="button" variant="outline">
              Filtrar
            </Button>
          }
        >
          <div className="mb-4 grid gap-3 md:grid-cols-5">
            <Input
              onChange={(event) =>
                setFilters((current) => ({ ...current, termo: event.target.value }))
              }
              placeholder="Nome do lote"
              value={filters.termo}
            />
            <select
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
              onChange={(event) =>
                setFilters((current) => ({ ...current, tipo: event.target.value }))
              }
              value={filters.tipo}
            >
              <option value="">Tipo</option>
              {loteTipos.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
              onChange={(event) =>
                setFilters((current) => ({ ...current, status: event.target.value }))
              }
              value={filters.status}
            >
              <option value="">Status</option>
              {loteStatus.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  conta_produto_id: event.target.value,
                }))
              }
              value={filters.conta_produto_id}
            >
              <option value="">Conta</option>
              {contas.map((conta) => (
                <option key={conta.id_conta_produto} value={conta.id_conta_produto}>
                  {conta.nome}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
              onChange={(event) =>
                setFilters((current) => ({ ...current, item_id: event.target.value }))
              }
              value={filters.item_id}
            >
              <option value="">Item</option>
              {itens.map((item) => (
                <option key={item.id_item} value={item.id_item}>
                  {item.nome}
                </option>
              ))}
            </select>
          </div>

          {lotes.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lote</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Conta</TableHead>
                  <TableHead className="hidden md:table-cell">Item</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lotes.map((lote) => (
                  <TableRow
                    className={selectedId === lote.id_lote_operacional ? 'bg-emerald-50' : undefined}
                    key={lote.id_lote_operacional}
                    onClick={() => void selectLote(lote)}
                  >
                    <TableCell className="font-semibold">{lote.nome}</TableCell>
                    <TableCell>{lote.tipo}</TableCell>
                    <TableCell>
                      <Badge variant={lote.status === 'FECHADO' ? 'secondary' : 'default'}>
                        {lote.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {asText(lote.conta_produto?.nome)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {asText(lote.item?.nome)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState title={loading ? 'Carregando lotes...' : undefined} />
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
            <span>
              Pagina {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button disabled={page <= 1 || loading} onClick={() => void loadLotes(page - 1)} type="button" variant="outline">
                Anterior
              </Button>
              <Button disabled={page >= totalPages || loading} onClick={() => void loadLotes(page + 1)} type="button" variant="outline">
                Proxima
              </Button>
            </div>
          </div>
        </ScreenSection>

        <ScreenSection
          title={selectedId ? 'Editar lote' : 'Novo lote'}
          actions={
            selectedId ? (
              <>
                <Button disabled={!mayEdit} onClick={() => void runSensitiveAction('fechar')} type="button" variant="outline">
                  Fechar
                </Button>
                <Button disabled={!isManager} onClick={() => void runSensitiveAction('reabrir')} type="button" variant="outline">
                  Reabrir
                </Button>
                <Button disabled={!isManager} onClick={() => void runSensitiveAction('cancelar')} type="button" variant="destructive">
                  Cancelar
                </Button>
              </>
            ) : null
          }
        >
          <form className="grid gap-4" onSubmit={save}>
            <div>
              <Label>Nome *</Label>
              <Input className="mt-2" onChange={(event) => updateField('nome', event.target.value)} required value={form.nome} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Tipo *</Label>
                <select className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" onChange={(event) => updateField('tipo', event.target.value)} value={form.tipo}>
                  {loteTipos.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
                </select>
              </div>
              <div>
                <Label>Conta de produto *</Label>
                <select className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" onChange={(event) => updateField('conta_produto_id', event.target.value)} required value={form.conta_produto_id}>
                  <option value="">Selecione</option>
                  {contas.map((conta) => <option key={conta.id_conta_produto} value={conta.id_conta_produto}>{conta.nome}</option>)}
                </select>
              </div>
              <div>
                <Label>Item *</Label>
                <select className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" onChange={(event) => updateField('item_id', event.target.value)} required value={form.item_id}>
                  <option value="">Selecione</option>
                  {itens.map((item) => <option key={item.id_item} value={item.id_item}>{item.nome}</option>)}
                </select>
              </div>
              <div>
                <Label>Contrato opcional</Label>
                <select className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" onChange={(event) => updateField('contrato_id', event.target.value)} value={form.contrato_id}>
                  <option value="">Sem contrato</option>
                  {contratos.map((contrato) => <option key={contrato.id_contrato} value={contrato.id_contrato}>{contrato.numero_contrato}</option>)}
                </select>
              </div>
              <div>
                <Label>Destino opcional</Label>
                <select className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" onChange={(event) => updateField('destino_id', event.target.value)} value={form.destino_id}>
                  <option value="">Sem destino</option>
                  {destinos.map((destino) => <option key={destino.id_destino} value={destino.id_destino}>{destino.nome}</option>)}
                </select>
              </div>
              <div>
                <Label>Imovel ref.</Label>
                <Input className="mt-2" onChange={(event) => updateField('imovel_id_ref', event.target.value)} type="number" value={form.imovel_id_ref} />
              </div>
              <div>
                <Label>Area/lote ref.</Label>
                <Input className="mt-2" onChange={(event) => updateField('area_lote_id_ref', event.target.value)} type="number" value={form.area_lote_id_ref} />
              </div>
              <div>
                <Label>Safra ref.</Label>
                <Input className="mt-2" onChange={(event) => updateField('safra_id_ref', event.target.value)} type="number" value={form.safra_id_ref} />
              </div>
            </div>
            <div>
              <Label>Observacao</Label>
              <Textarea className="mt-2" onChange={(event) => updateField('observacao', event.target.value)} value={form.observacao} />
            </div>

            <StatusMessage status={status} />

            <div className="flex flex-wrap gap-2">
              <Button disabled={loading || !canSave} type="submit">
                Salvar
              </Button>
              <Button onClick={newLote} type="button" variant="outline">
                Limpar
              </Button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <h3 className="text-sm font-bold text-slate-700">Pesagens vinculadas</h3>
            <div className="mt-3 rounded-md border border-slate-100">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Romaneio</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Peso</TableHead>
                    <TableHead>Final</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedPesagens.map((pesagem) => (
                    <TableRow key={pesagem.id_pesagem}>
                      <TableCell>{pesagem.numero_romaneio || '-'}</TableCell>
                      <TableCell>{asText(pesagem.placa)}</TableCell>
                      <TableCell>{formatKg(pesagem.peso_liquido_kg)}</TableCell>
                      <TableCell>{formatSacas(pesagem.classificacao?.sacas_final)}</TableCell>
                    </TableRow>
                  ))}
                  {!selectedPesagens.length ? (
                    <TableRow>
                      <TableCell className="text-slate-500" colSpan={4}>
                        Nenhuma pesagem vinculada.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </div>
        </ScreenSection>
      </div>
    </section>
  )
}

export default LotesOperacionaisPage
