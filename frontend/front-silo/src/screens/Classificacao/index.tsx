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
import { normalizePaginated } from '@/services/api'
import { pesagensApi } from '@/services/silo.service'
import type { Pesagem, StatusMessageState } from '@/types'
import {
  asText,
  formatKg,
  formatPercent,
  formatSacas,
} from '@/utils/formatters'
import EmptyState from '@/screens/_shared/EmptyState'
import PageHeader from '@/screens/_shared/PageHeader'
import ScreenSection from '@/screens/_shared/ScreenSection'

type ClassificacaoForm = {
  umidade_percentual: string
  impureza_percentual: string
}

const PAGE_SIZE = 20
const emptyForm: ClassificacaoForm = {
  umidade_percentual: '',
  impureza_percentual: '',
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Nao foi possivel concluir.'
}

function ClassificacaoPage() {
  const [pesagens, setPesagens] = useState<Pesagem[]>([])
  const [selected, setSelected] = useState<Pesagem | null>(null)
  const [form, setForm] = useState<ClassificacaoForm>(emptyForm)
  const [filters, setFilters] = useState({ placa: '', romaneio: '' })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<StatusMessageState>(null)

  const classificacao = selected?.classificacao
  const selectedInfo = useMemo(
    () => [
      ['Romaneio', selected?.numero_romaneio],
      ['Placa', selected?.placa],
      ['Conta', selected?.conta_produto?.nome],
      ['Item', selected?.item?.nome],
      ['Peso liquido', formatKg(selected?.peso_liquido_kg)],
      ['Status', selected?.status],
    ],
    [selected],
  )

  async function loadPesagens(nextPage = page) {
    setLoading(true)
    setStatus(null)

    try {
      const response = await pesagensApi.list({
        status: 'PESAGEM_2_REALIZADA',
        placa: filters.placa || undefined,
        numero_romaneio: filters.romaneio || undefined,
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
    void loadPesagens(1)
  }, [])

  async function selectPesagem(pesagem: Pesagem) {
    setLoading(true)
    setStatus(null)

    try {
      const detailed = await pesagensApi.get(pesagem.id_pesagem)
      setSelected(detailed)
      setForm({
        umidade_percentual: detailed.classificacao?.umidade_percentual
          ? String(detailed.classificacao.umidade_percentual)
          : '',
        impureza_percentual: detailed.classificacao?.impureza_percentual
          ? String(detailed.classificacao.impureza_percentual)
          : '',
      })
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  async function classificar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) return

    setLoading(true)
    setStatus(null)

    try {
      const updated = await pesagensApi.classificar(selected.id_pesagem, {
        umidade_percentual: Number(form.umidade_percentual),
        impureza_percentual: Number(form.impureza_percentual),
      })
      setSelected(updated)
      setStatus({ type: 'success', message: 'Classificacao registrada.' })
      await loadPesagens(page)
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="px-4 py-6 sm:px-6">
      <PageHeader
        title="Classificacao"
        description="Registro tecnico de umidade e impureza para calculo automatico de descontos."
      />

      <StatusMessage status={status} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <ScreenSection
          title="Pendentes"
          actions={
            <Button disabled={loading} onClick={() => void loadPesagens(1)} type="button" variant="outline">
              Filtrar
            </Button>
          }
        >
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <Input onChange={(event) => setFilters((current) => ({ ...current, romaneio: event.target.value }))} placeholder="Romaneio" value={filters.romaneio} />
            <Input onChange={(event) => setFilters((current) => ({ ...current, placa: event.target.value }))} placeholder="Placa" value={filters.placa} />
          </div>

          {pesagens.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Romaneio</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Item</TableHead>
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
                    <TableCell className="font-semibold">{pesagem.numero_romaneio || '-'}</TableCell>
                    <TableCell>{asText(pesagem.placa)}</TableCell>
                    <TableCell>{asText(pesagem.item?.nome)}</TableCell>
                    <TableCell>{formatKg(pesagem.peso_liquido_kg)}</TableCell>
                    <TableCell><Badge variant="outline">{pesagem.status || '-'}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState title={loading ? 'Carregando pesagens...' : undefined} />
          )}

          <div className="mt-4 flex justify-between text-sm text-slate-600">
            <span>Pagina {page} de {totalPages}</span>
            <div className="flex gap-2">
              <Button disabled={page <= 1 || loading} onClick={() => void loadPesagens(page - 1)} type="button" variant="outline">Anterior</Button>
              <Button disabled={page >= totalPages || loading} onClick={() => void loadPesagens(page + 1)} type="button" variant="outline">Proxima</Button>
            </div>
          </div>
        </ScreenSection>

        <ScreenSection title="Classificar pesagem">
          {selected ? (
            <div className="space-y-5">
              <div className="grid gap-2 text-sm">
                {selectedInfo.map(([label, value]) => (
                  <div className="flex justify-between gap-4 border-b border-slate-100 py-2" key={label}>
                    <span className="font-bold text-slate-600">{label}</span>
                    <span className="text-right">{asText(value)}</span>
                  </div>
                ))}
              </div>

              <form className="grid gap-4" onSubmit={classificar}>
                <div>
                  <Label>Umidade % *</Label>
                  <Input className="mt-2" onChange={(event) => setForm((current) => ({ ...current, umidade_percentual: event.target.value }))} required type="number" value={form.umidade_percentual} />
                </div>
                <div>
                  <Label>Impureza % *</Label>
                  <Input className="mt-2" onChange={(event) => setForm((current) => ({ ...current, impureza_percentual: event.target.value }))} required type="number" value={form.impureza_percentual} />
                </div>
                <Button disabled={loading} type="submit">Finalizar classificacao</Button>
              </form>

              <div className="rounded-md border border-emerald-100 bg-emerald-50 p-4">
                <h3 className="text-sm font-bold text-emerald-900">Resultado</h3>
                <div className="mt-3 grid gap-2 text-sm font-semibold text-emerald-950">
                  <span>Tabela: {classificacao?.tabela_desconto_id || '-'}</span>
                  <span>Desc. umidade: {formatPercent(classificacao?.desconto_umidade_percentual)} / {formatKg(classificacao?.desconto_umidade_kg)}</span>
                  <span>Desc. impureza: {formatPercent(classificacao?.desconto_impureza_percentual)} / {formatKg(classificacao?.desconto_impureza_kg)}</span>
                  <span>Peso final: {formatKg(classificacao?.peso_final_kg)}</span>
                  <span>Sacas finais: {formatSacas(classificacao?.sacas_final)}</span>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState description="Selecione uma pesagem pendente." title="Nenhuma pesagem selecionada." />
          )}
        </ScreenSection>
      </div>
    </section>
  )
}

export default ClassificacaoPage
