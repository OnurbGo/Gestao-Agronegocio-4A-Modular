import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
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
import { itensApi, tabelasDescontoApi } from '@/services/silo.service'
import type {
  AuthUser,
  FaixaDesconto,
  ItemSilo,
  StatusMessageState,
  TabelaDesconto,
} from '@/types'
import { asText } from '@/utils/formatters'
import EmptyState from '@/screens/_shared/EmptyState'
import PageHeader from '@/screens/_shared/PageHeader'
import ScreenSection from '@/screens/_shared/ScreenSection'
import FaixasDescontoTable from './components/FaixasDescontoTable'
import SimuladorDesconto from './components/SimuladorDesconto'
import TabelaDescontoForm from './components/TabelaDescontoForm'
import type { TabelaDescontoFormState } from './components/TabelaDescontoForm'

type TabelasDescontoPageProps = {
  usuario: AuthUser
}

type FaixaForm = {
  tipo: string
  valor_inicial: string
  valor_final: string
  percentual_desconto: string
}

const PAGE_SIZE = 20
const emptyTabelaForm: TabelaDescontoFormState = {
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

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Não foi possível concluir.'
}

function normalizeTabelaForm(tabela?: TabelaDesconto | null): TabelaDescontoFormState {
  return {
    item_id: tabela?.item_id ? String(tabela.item_id) : '',
    nome: tabela?.nome || '',
    ativa: tabela?.ativa !== false,
    vigencia_inicio: tabela?.vigencia_inicio ? String(tabela.vigencia_inicio).slice(0, 10) : '',
    vigencia_fim: tabela?.vigencia_fim ? String(tabela.vigencia_fim).slice(0, 10) : '',
  }
}

function buildTabelaPayload(form: TabelaDescontoFormState) {
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

function TabelasDescontoPage({ usuario }: TabelasDescontoPageProps) {
  const [itens, setItens] = useState<ItemSilo[]>([])
  const [tabelas, setTabelas] = useState<TabelaDesconto[]>([])
  const [selected, setSelected] = useState<TabelaDesconto | null>(null)
  const [form, setForm] = useState<TabelaDescontoFormState>(emptyTabelaForm)
  const [faixaForm, setFaixaForm] = useState<FaixaForm>(emptyFaixaForm)
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

  return (
    <section className="px-4 py-6 sm:px-6">
      <PageHeader
        title="Tabelas de Desconto"
        description="Consulta, simulação e gestão das faixas de umidade e impureza usadas na classificação."
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
              <span>Página {page} de {totalPages}</span>
              <div className="flex gap-2">
                <Button disabled={page <= 1 || loading} onClick={() => void loadTabelas(page - 1)} type="button" variant="outline">Anterior</Button>
                <Button disabled={page >= totalPages || loading} onClick={() => void loadTabelas(page + 1)} type="button" variant="outline">Próxima</Button>
              </div>
            </div>
          </ScreenSection>

          <ScreenSection title="Simulador de desconto">
            <SimuladorDesconto itens={itens} />
          </ScreenSection>
        </div>

        <div className="grid gap-5">
          <ScreenSection title={selected ? 'Editar tabela' : 'Nova tabela'}>
            <TabelaDescontoForm
              canManage={canManage}
              form={form}
              itens={itens}
              loading={loading}
              onChange={setForm}
              onClear={newTabela}
              onSubmit={saveTabela}
              selected={selected}
            />
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

            <div className="mt-4 grid gap-4">
              <FaixasDescontoTable
                canManage={canManage}
                faixas={faixas}
                onRemove={(faixa) => void removeFaixa(faixa)}
                tipo="UMIDADE"
                title="Faixas de Umidade"
              />
              <FaixasDescontoTable
                canManage={canManage}
                faixas={faixas}
                onRemove={(faixa) => void removeFaixa(faixa)}
                tipo="IMPUREZA"
                title="Faixas de Impureza"
              />
            </div>
          </ScreenSection>
        </div>
      </div>
    </section>
  )
}

export default TabelasDescontoPage
