import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
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
import { normalizePaginated } from '@/services/api'
import { itensApi, tabelasDescontoApi } from '@/services/silo.service'
import type {
  AuthUser,
  FaixaDesconto,
  ItemSilo,
  StatusMessageState,
  TabelaDesconto,
} from '@/types'
import {
  asText,
  formatKg,
  formatPercent,
  formatSacas,
} from '@/utils/formatters'
import EmptyState from '@/screens/_shared/EmptyState'
import PageHeader from '@/screens/_shared/PageHeader'
import ScreenSection from '@/screens/_shared/ScreenSection'

type TabelasDescontoPageProps = {
  usuario: AuthUser
}

type TabelaForm = {
  item_id: string
  nome: string
  ativa: boolean
  vigencia_inicio: string
  vigencia_fim: string
}

type FaixaForm = {
  tipo: string
  valor_inicial: string
  valor_final: string
  percentual_desconto: string
}

type SimuladorForm = {
  item_id: string
  peso_liquido_kg: string
  umidade_percentual: string
  impureza_percentual: string
}

const PAGE_SIZE = 20
const emptyTabelaForm: TabelaForm = {
  item_id: '',
  nome: '',
  ativa: true,
  vigencia_inicio: '',
  vigencia_fim: '',
}
const emptyFaixaForm: FaixaForm = {
  tipo: 'UMIDADE',
  valor_inicial: '',
  valor_final: '',
  percentual_desconto: '',
}
const emptySimuladorForm: SimuladorForm = {
  item_id: '',
  peso_liquido_kg: '',
  umidade_percentual: '',
  impureza_percentual: '',
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Nao foi possivel concluir.'
}

function normalizeTabelaForm(tabela?: TabelaDesconto | null): TabelaForm {
  return {
    item_id: tabela?.item_id ? String(tabela.item_id) : '',
    nome: tabela?.nome || '',
    ativa: tabela?.ativa !== false,
    vigencia_inicio: tabela?.vigencia_inicio ? String(tabela.vigencia_inicio).slice(0, 10) : '',
    vigencia_fim: tabela?.vigencia_fim ? String(tabela.vigencia_fim).slice(0, 10) : '',
  }
}

function buildTabelaPayload(form: TabelaForm) {
  return {
    item_id: Number(form.item_id),
    nome: form.nome.trim(),
    ativa: form.ativa,
    vigencia_inicio: form.vigencia_inicio || null,
    vigencia_fim: form.vigencia_fim || null,
  }
}

function buildFaixaPayload(form: FaixaForm) {
  return {
    tipo: form.tipo,
    valor_inicial: Number(form.valor_inicial),
    valor_final: Number(form.valor_final),
    percentual_desconto: Number(form.percentual_desconto),
    ativa: true,
  }
}

function hasOverlap(faixas: FaixaDesconto[], form: FaixaForm) {
  const inicial = Number(form.valor_inicial)
  const final = Number(form.valor_final)
  if (!Number.isFinite(inicial) || !Number.isFinite(final)) return false

  return faixas.some((faixa) => {
    if (faixa.tipo !== form.tipo || faixa.ativa === false) return false
    const faixaInicial = Number(faixa.valor_inicial)
    const faixaFinal = Number(faixa.valor_final)
    return inicial <= faixaFinal && final >= faixaInicial
  })
}

function getResultValue(result: Record<string, unknown> | null, key: string) {
  return result?.[key] ?? result?.data?.[key as never]
}

function TabelasDescontoPage({ usuario }: TabelasDescontoPageProps) {
  const [itens, setItens] = useState<ItemSilo[]>([])
  const [tabelas, setTabelas] = useState<TabelaDesconto[]>([])
  const [selected, setSelected] = useState<TabelaDesconto | null>(null)
  const [form, setForm] = useState<TabelaForm>(emptyTabelaForm)
  const [faixaForm, setFaixaForm] = useState<FaixaForm>(emptyFaixaForm)
  const [simuladorForm, setSimuladorForm] = useState<SimuladorForm>(emptySimuladorForm)
  const [simuladorResult, setSimuladorResult] = useState<Record<string, unknown> | null>(null)
  const [filters, setFilters] = useState({ item_id: '', ativa: '' })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<StatusMessageState>(null)

  const canManage = Boolean(usuario.possuiAdmin || usuario.possuiGerente)
  const faixas = useMemo(() => selected?.faixas || [], [selected])
  const overlapWarning = hasOverlap(faixas, faixaForm)

  async function loadOptions() {
    const loadedItens = normalizePaginated(await itensApi.list({ limit: 100 }), 100)
    setItens(loadedItens.items)
  }

  async function loadTabelas(nextPage = page) {
    setLoading(true)
    setStatus(null)

    try {
      const response = await tabelasDescontoApi.list({
        item_id: filters.item_id || undefined,
        ativa: filters.ativa === '' ? undefined : filters.ativa === 'ativa',
        page: nextPage,
        limit: PAGE_SIZE,
      })
      const normalized = normalizePaginated(response, PAGE_SIZE)
      setTabelas(normalized.items)
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
    void loadTabelas(1)
  }, [])

  async function selectTabela(tabela: TabelaDesconto) {
    setLoading(true)
    setStatus(null)

    try {
      const detailed = await tabelasDescontoApi.get(tabela.id_tabela_desconto)
      setSelected(detailed)
      setForm(normalizeTabelaForm(detailed))
      setFaixaForm(emptyFaixaForm)
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  function newTabela() {
    setSelected(null)
    setForm(emptyTabelaForm)
    setFaixaForm(emptyFaixaForm)
    setStatus(null)
  }

  async function saveTabela(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canManage) {
      setStatus({ type: 'warning', message: 'Gerenciamento restrito a Gerente/Admin.' })
      return
    }

    setLoading(true)
    setStatus(null)

    try {
      const saved = selected
        ? await tabelasDescontoApi.update(selected.id_tabela_desconto, buildTabelaPayload(form))
        : await tabelasDescontoApi.create(buildTabelaPayload(form))
      setSelected(saved)
      setForm(normalizeTabelaForm(saved))
      setStatus({ type: 'success', message: 'Tabela salva.' })
      await loadTabelas(page)
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  async function addFaixa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected || !canManage) return
    if (overlapWarning) {
      setStatus({ type: 'warning', message: 'Faixa sobreposta com intervalo existente.' })
      return
    }

    setLoading(true)
    setStatus(null)

    try {
      await tabelasDescontoApi.addFaixa(selected.id_tabela_desconto, buildFaixaPayload(faixaForm))
      const detailed = await tabelasDescontoApi.get(selected.id_tabela_desconto)
      setSelected(detailed)
      setFaixaForm(emptyFaixaForm)
      setStatus({ type: 'success', message: 'Faixa adicionada.' })
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  async function removeFaixa(faixa: FaixaDesconto) {
    if (!canManage) return
    const confirmed = window.confirm('Desativar esta faixa de desconto?')
    if (!confirmed) return

    setLoading(true)
    setStatus(null)

    try {
      await tabelasDescontoApi.removeFaixa(faixa.id_faixa_desconto)
      if (selected) setSelected(await tabelasDescontoApi.get(selected.id_tabela_desconto))
      setStatus({ type: 'success', message: 'Faixa desativada.' })
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  async function simular(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setStatus(null)
    setSimuladorResult(null)

    try {
      setSimuladorResult(
        await tabelasDescontoApi.calcular({
          item_id: Number(simuladorForm.item_id),
          peso_liquido_kg: Number(simuladorForm.peso_liquido_kg),
          umidade_percentual: Number(simuladorForm.umidade_percentual),
          impureza_percentual: Number(simuladorForm.impureza_percentual),
        }),
      )
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="px-4 py-6 sm:px-6">
      <PageHeader
        title="Tabelas de Desconto"
        description="Consulta, simulacao e gestao das faixas de umidade e impureza usadas na classificacao."
        actions={
          <Button disabled={!canManage} onClick={newTabela} type="button">
            Nova tabela
          </Button>
        }
      />

      <StatusMessage status={status} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_460px]">
        <div className="grid gap-5">
          <ScreenSection
            title="Tabelas"
            actions={
              <Button disabled={loading} onClick={() => void loadTabelas(1)} type="button" variant="outline">
                Filtrar
              </Button>
            }
          >
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" onChange={(event) => setFilters((current) => ({ ...current, item_id: event.target.value }))} value={filters.item_id}>
                <option value="">Todos os itens</option>
                {itens.map((item) => <option key={item.id_item} value={item.id_item}>{item.nome}</option>)}
              </select>
              <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" onChange={(event) => setFilters((current) => ({ ...current, ativa: event.target.value }))} value={filters.ativa}>
                <option value="">Todas</option>
                <option value="ativa">Ativas</option>
                <option value="inativa">Inativas</option>
              </select>
            </div>
            {tabelas.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tabelas.map((tabela) => (
                    <TableRow
                      className={selected?.id_tabela_desconto === tabela.id_tabela_desconto ? 'bg-emerald-50' : undefined}
                      key={tabela.id_tabela_desconto}
                      onClick={() => void selectTabela(tabela)}
                    >
                      <TableCell className="font-semibold">{tabela.nome}</TableCell>
                      <TableCell>{asText(tabela.item?.nome)}</TableCell>
                      <TableCell>
                        <Badge variant={tabela.ativa ? 'default' : 'secondary'}>
                          {tabela.ativa ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState title={loading ? 'Carregando tabelas...' : undefined} />
            )}
            <div className="mt-4 flex justify-between text-sm text-slate-600">
              <span>Pagina {page} de {totalPages}</span>
              <div className="flex gap-2">
                <Button disabled={page <= 1 || loading} onClick={() => void loadTabelas(page - 1)} type="button" variant="outline">Anterior</Button>
                <Button disabled={page >= totalPages || loading} onClick={() => void loadTabelas(page + 1)} type="button" variant="outline">Proxima</Button>
              </div>
            </div>
          </ScreenSection>

          <ScreenSection title="Simulador">
            <form className="grid gap-3 md:grid-cols-5" onSubmit={simular}>
              <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm md:col-span-2" onChange={(event) => setSimuladorForm((current) => ({ ...current, item_id: event.target.value }))} required value={simuladorForm.item_id}>
                <option value="">Item</option>
                {itens.map((item) => <option key={item.id_item} value={item.id_item}>{item.nome}</option>)}
              </select>
              <Input onChange={(event) => setSimuladorForm((current) => ({ ...current, peso_liquido_kg: event.target.value }))} placeholder="Peso liquido kg" required type="number" value={simuladorForm.peso_liquido_kg} />
              <Input onChange={(event) => setSimuladorForm((current) => ({ ...current, umidade_percentual: event.target.value }))} placeholder="Umidade %" required type="number" value={simuladorForm.umidade_percentual} />
              <Input onChange={(event) => setSimuladorForm((current) => ({ ...current, impureza_percentual: event.target.value }))} placeholder="Impureza %" required type="number" value={simuladorForm.impureza_percentual} />
              <Button className="md:col-span-5" disabled={loading} type="submit" variant="outline">
                Calcular
              </Button>
            </form>
            {simuladorResult ? (
              <div className="mt-4 grid gap-3 rounded-md border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900 md:grid-cols-4">
                <span>Desc. umidade: {formatKg(getResultValue(simuladorResult, 'desconto_umidade_kg'))}</span>
                <span>Desc. impureza: {formatKg(getResultValue(simuladorResult, 'desconto_impureza_kg'))}</span>
                <span>Peso final: {formatKg(getResultValue(simuladorResult, 'peso_final_kg'))}</span>
                <span>Sacas: {formatSacas(getResultValue(simuladorResult, 'sacas_final'))}</span>
              </div>
            ) : null}
          </ScreenSection>
        </div>

        <div className="grid gap-5">
          <ScreenSection title={selected ? 'Editar tabela' : 'Nova tabela'}>
            <form className="grid gap-4" onSubmit={saveTabela}>
              <div>
                <Label>Item *</Label>
                <select className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" onChange={(event) => setForm((current) => ({ ...current, item_id: event.target.value }))} required value={form.item_id}>
                  <option value="">Selecione</option>
                  {itens.map((item) => <option key={item.id_item} value={item.id_item}>{item.nome}</option>)}
                </select>
              </div>
              <div>
                <Label>Nome *</Label>
                <Input className="mt-2" onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))} required value={form.nome} />
              </div>
              <label className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold">
                <Checkbox checked={form.ativa} onCheckedChange={(checked) => setForm((current) => ({ ...current, ativa: Boolean(checked) }))} />
                Tabela ativa
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Inicio vigencia</Label>
                  <Input className="mt-2" onChange={(event) => setForm((current) => ({ ...current, vigencia_inicio: event.target.value }))} type="date" value={form.vigencia_inicio} />
                </div>
                <div>
                  <Label>Fim vigencia</Label>
                  <Input className="mt-2" onChange={(event) => setForm((current) => ({ ...current, vigencia_fim: event.target.value }))} type="date" value={form.vigencia_fim} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button disabled={loading || !canManage} type="submit">Salvar</Button>
                <Button onClick={newTabela} type="button" variant="outline">Limpar</Button>
              </div>
            </form>
          </ScreenSection>

          <ScreenSection title="Faixas">
            <form className="grid gap-3" onSubmit={addFaixa}>
              <div className="grid gap-3 sm:grid-cols-2">
                <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" onChange={(event) => setFaixaForm((current) => ({ ...current, tipo: event.target.value }))} value={faixaForm.tipo}>
                  <option value="UMIDADE">UMIDADE</option>
                  <option value="IMPUREZA">IMPUREZA</option>
                </select>
                <Input onChange={(event) => setFaixaForm((current) => ({ ...current, percentual_desconto: event.target.value }))} placeholder="Desconto %" required type="number" value={faixaForm.percentual_desconto} />
                <Input onChange={(event) => setFaixaForm((current) => ({ ...current, valor_inicial: event.target.value }))} placeholder="Valor inicial" required type="number" value={faixaForm.valor_inicial} />
                <Input onChange={(event) => setFaixaForm((current) => ({ ...current, valor_final: event.target.value }))} placeholder="Valor final" required type="number" value={faixaForm.valor_final} />
              </div>
              {overlapWarning ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
                  Intervalo sobreposto com outra faixa ativa.
                </p>
              ) : null}
              <Button disabled={!selected || loading || !canManage} type="submit" variant="outline">
                Adicionar faixa
              </Button>
            </form>

            <Table wrapperClassName="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Intervalo</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faixas.map((faixa) => (
                  <TableRow key={faixa.id_faixa_desconto}>
                    <TableCell>{faixa.tipo}</TableCell>
                    <TableCell>
                      {formatPercent(faixa.valor_inicial)} a {formatPercent(faixa.valor_final)}
                    </TableCell>
                    <TableCell>{formatPercent(faixa.percentual_desconto)}</TableCell>
                    <TableCell>
                      <Button disabled={!canManage} onClick={() => void removeFaixa(faixa)} type="button" variant="ghost">
                        Desativar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!faixas.length ? (
                  <TableRow>
                    <TableCell className="text-slate-500" colSpan={4}>
                      Nenhuma faixa cadastrada.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </ScreenSection>
        </div>
      </div>
    </section>
  )
}

export default TabelasDescontoPage
