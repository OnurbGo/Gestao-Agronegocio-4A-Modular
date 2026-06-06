import { useEffect, useMemo, useState } from 'react'
import StatusMessage from '@/components/feedback/StatusMessage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { normalizePaginated } from '@/services/api'
import {
  contasProdutoApi,
  itensApi,
  lotesApi,
  pesagensApi,
} from '@/services/silo.service'
import type {
  ContaProduto,
  ItemSilo,
  LoteOperacional,
  Pesagem,
  StatusMessageState,
} from '@/types'
import {
  asText,
  formatDateTime,
  formatKg,
  formatPercent,
  formatSacas,
} from '@/utils/formatters'
import EmptyState from '@/screens/_shared/EmptyState'
import PageHeader from '@/screens/_shared/PageHeader'
import ScreenSection from '@/screens/_shared/ScreenSection'

const PAGE_SIZE = 20
const pesagemStatus = [
  'ABERTA',
  'PESAGEM_1_REALIZADA',
  'PESAGEM_2_REALIZADA',
  'CLASSIFICADA',
  'FINALIZADA',
  'CANCELADA',
]
const tiposOperacao = ['ENTRADA', 'SAIDA']

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Nao foi possivel carregar pesagens.'
}

function PesagensPage() {
  const [pesagens, setPesagens] = useState<Pesagem[]>([])
  const [selected, setSelected] = useState<Pesagem | null>(null)
  const [contas, setContas] = useState<ContaProduto[]>([])
  const [itens, setItens] = useState<ItemSilo[]>([])
  const [lotes, setLotes] = useState<LoteOperacional[]>([])
  const [filters, setFilters] = useState({
    romaneio: '',
    placa: '',
    lote_operacional_id: '',
    conta_produto_id: '',
    item_id: '',
    status: '',
    tipo_operacao: '',
  })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<StatusMessageState>(null)

  const selectedRows = useMemo(
    () => [
      ['Status', selected?.status],
      ['Tipo', selected?.tipo_operacao],
      ['Lote', selected?.lote_operacional?.nome],
      ['Conta', selected?.conta_produto?.nome],
      ['Item', selected?.item?.nome],
      ['Deposito', selected?.deposito?.nome],
      ['Destino', selected?.destino?.nome],
      ['Transportadora', selected?.transportadora?.nome],
      ['Emissor', selected?.emissor?.nome],
      ['Motorista', selected?.motorista_nome],
      ['Pesagem 1', formatKg(selected?.pesagem_1_kg)],
      ['Pesagem 2', formatKg(selected?.pesagem_2_kg)],
      ['Peso liquido', formatKg(selected?.peso_liquido_kg)],
      ['Finalizada em', formatDateTime(selected?.finalizada_em)],
    ],
    [selected],
  )

  async function loadOptions() {
    const [loadedContas, loadedItens, loadedLotes] = await Promise.all([
      contasProdutoApi.list({ limit: 100 }),
      itensApi.list({ limit: 100 }),
      lotesApi.list({ limit: 100 }),
    ])
    setContas(normalizePaginated(loadedContas, 100).items)
    setItens(normalizePaginated(loadedItens, 100).items)
    setLotes(normalizePaginated(loadedLotes, 100).items)
  }

  async function loadPesagens(nextPage = page) {
    setLoading(true)
    setStatus(null)

    try {
      const response = await pesagensApi.list({
        numero_romaneio: filters.romaneio || undefined,
        placa: filters.placa || undefined,
        lote_operacional_id: filters.lote_operacional_id || undefined,
        conta_produto_id: filters.conta_produto_id || undefined,
        item_id: filters.item_id || undefined,
        status: filters.status || undefined,
        tipo_operacao: filters.tipo_operacao || undefined,
        page: nextPage,
        limit: PAGE_SIZE,
      })
      const normalized = normalizePaginated(response, PAGE_SIZE)
      setPesagens(normalized.items)
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
    void loadPesagens(1)
  }, [])

  async function selectPesagem(pesagem: Pesagem) {
    setLoading(true)
    setStatus(null)

    try {
      setSelected(await pesagensApi.get(pesagem.id_pesagem))
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  function updateFilter(field: keyof typeof filters, value: string) {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  return (
    <section className="px-4 py-6 sm:px-6">
      <PageHeader
        title="Pesagens"
        description="Consulta operacional de romaneios, pesos, classificacao e dados herdados do lote."
      />

      <StatusMessage status={status} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <ScreenSection
          title="Consulta"
          actions={
            <Button disabled={loading} onClick={() => void loadPesagens(1)} type="button" variant="outline">
              Filtrar
            </Button>
          }
        >
          <div className="mb-4 grid gap-3 md:grid-cols-4 xl:grid-cols-7">
            <Input onChange={(event) => updateFilter('romaneio', event.target.value)} placeholder="Romaneio" value={filters.romaneio} />
            <Input onChange={(event) => updateFilter('placa', event.target.value)} placeholder="Placa" value={filters.placa} />
            <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" onChange={(event) => updateFilter('lote_operacional_id', event.target.value)} value={filters.lote_operacional_id}>
              <option value="">Lote</option>
              {lotes.map((lote) => <option key={lote.id_lote_operacional} value={lote.id_lote_operacional}>{lote.nome}</option>)}
            </select>
            <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" onChange={(event) => updateFilter('conta_produto_id', event.target.value)} value={filters.conta_produto_id}>
              <option value="">Conta</option>
              {contas.map((conta) => <option key={conta.id_conta_produto} value={conta.id_conta_produto}>{conta.nome}</option>)}
            </select>
            <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" onChange={(event) => updateFilter('item_id', event.target.value)} value={filters.item_id}>
              <option value="">Item</option>
              {itens.map((item) => <option key={item.id_item} value={item.id_item}>{item.nome}</option>)}
            </select>
            <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" onChange={(event) => updateFilter('tipo_operacao', event.target.value)} value={filters.tipo_operacao}>
              <option value="">Tipo</option>
              {tiposOperacao.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
            </select>
            <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" onChange={(event) => updateFilter('status', event.target.value)} value={filters.status}>
              <option value="">Status</option>
              {pesagemStatus.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>

          {pesagens.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Romaneio</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead className="hidden md:table-cell">Conta</TableHead>
                  <TableHead className="hidden md:table-cell">Item</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pesagens.map((pesagem) => (
                  <TableRow
                    className={selected?.id_pesagem === pesagem.id_pesagem ? 'bg-emerald-50' : undefined}
                    key={pesagem.id_pesagem}
                    onClick={() => void selectPesagem(pesagem)}
                  >
                    <TableCell className="font-semibold">
                      {pesagem.serie_romaneio?.numero_serie ? `${pesagem.serie_romaneio.numero_serie}/` : ''}
                      {pesagem.numero_romaneio || '-'}
                    </TableCell>
                    <TableCell>{asText(pesagem.placa)}</TableCell>
                    <TableCell className="hidden md:table-cell">{asText(pesagem.conta_produto?.nome)}</TableCell>
                    <TableCell className="hidden md:table-cell">{asText(pesagem.item?.nome)}</TableCell>
                    <TableCell>{formatKg(pesagem.peso_liquido_kg)}</TableCell>
                    <TableCell><Badge variant="outline">{pesagem.status || '-'}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState title={loading ? 'Carregando pesagens...' : undefined} />
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
            <span>Pagina {page} de {totalPages}</span>
            <div className="flex gap-2">
              <Button disabled={loading || page <= 1} onClick={() => void loadPesagens(page - 1)} type="button" variant="outline">Anterior</Button>
              <Button disabled={loading || page >= totalPages} onClick={() => void loadPesagens(page + 1)} type="button" variant="outline">Proxima</Button>
            </div>
          </div>
        </ScreenSection>

        <ScreenSection title="Detalhe da pesagem">
          {selected ? (
            <div className="space-y-5">
              <div className="grid gap-2 text-sm">
                {selectedRows.map(([label, value]) => (
                  <div className="flex justify-between gap-4 border-b border-slate-100 py-2" key={label}>
                    <span className="font-bold text-slate-600">{label}</span>
                    <span className="text-right text-slate-900">{asText(value)}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-md border border-emerald-100 bg-emerald-50 p-4">
                <h3 className="text-sm font-bold text-emerald-900">Classificacao</h3>
                <div className="mt-3 grid gap-2 text-sm">
                  <span>Umidade: {formatPercent(selected.classificacao?.umidade_percentual)}</span>
                  <span>Impureza: {formatPercent(selected.classificacao?.impureza_percentual)}</span>
                  <span>Peso final: {formatKg(selected.classificacao?.peso_final_kg)}</span>
                  <span>Sacas finais: {formatSacas(selected.classificacao?.sacas_final)}</span>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              description="Selecione uma pesagem para ver o detalhe operacional."
              title="Nenhuma pesagem selecionada."
            />
          )}
        </ScreenSection>
      </div>
    </section>
  )
}

export default PesagensPage
