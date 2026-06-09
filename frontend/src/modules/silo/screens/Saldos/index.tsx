import { useEffect, useState } from 'react'
import StatusMessage from '@/shared/components/feedback/StatusMessage'
import { Button } from '@/shared/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { normalizePaginated } from '@/shared/services/api'
import {
  contasProdutoApi,
  depositosApi,
  itensApi,
  relatoriosApi,
} from '@/shared/services/silo.service'
import type {
  ContaProduto,
  Deposito,
  ItemSilo,
  SaldoContaProduto,
  SaldoDeposito,
  StatusMessageState,
} from '@/shared/types'
import { asText, formatKg, formatSacas } from '@/shared/utils/formatters'
import EmptyState from '@/modules/silo/screens/_shared/EmptyState'
import PageHeader from '@/modules/silo/screens/_shared/PageHeader'
import ScreenSection from '@/modules/silo/screens/_shared/ScreenSection'
import SiloBalanceCard from './components/SiloBalanceCard'

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Não foi possível carregar saldos.'
}

function SaldosPage() {
  const [saldosConta, setSaldosConta] = useState<SaldoContaProduto[]>([])
  const [saldosDeposito, setSaldosDeposito] = useState<SaldoDeposito[]>([])
  const [contas, setContas] = useState<ContaProduto[]>([])
  const [itens, setItens] = useState<ItemSilo[]>([])
  const [depositos, setDepositos] = useState<Deposito[]>([])
  const [filters, setFilters] = useState({
    item_id: '',
    conta_produto_id: '',
    deposito_id: '',
  })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<StatusMessageState>(null)

  async function loadOptions() {
    const [loadedContas, loadedItens, loadedDepositos] = await Promise.all([
      contasProdutoApi.list({ limit: 100 }),
      itensApi.list({ limit: 100 }),
      depositosApi.list({ limit: 100 }),
    ])
    setContas(normalizePaginated(loadedContas, 100).items)
    setItens(normalizePaginated(loadedItens, 100).items)
    setDepositos(normalizePaginated(loadedDepositos, 100).items)
  }

  async function loadSaldos() {
    setLoading(true)
    setStatus(null)

    try {
      const [contaResult, depositoResult] = await Promise.all([
        relatoriosApi.saldosConta({
          item_id: filters.item_id || undefined,
          conta_produto_id: filters.conta_produto_id || undefined,
          limit: 100,
        }),
        relatoriosApi.saldosDeposito({
          item_id: filters.item_id || undefined,
          deposito_id: filters.deposito_id || undefined,
          limit: 100,
        }),
      ])
      setSaldosConta(normalizePaginated(contaResult, 100).items)
      setSaldosDeposito(normalizePaginated(depositoResult, 100).items)
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadOptions()
    void loadSaldos()
  }, [])

  const maxSaldoDepositoKg = saldosDeposito.reduce(
    (max, saldo) => Math.max(max, Number(saldo.saldo_kg || 0)),
    0,
  )

  return (
    <section className="px-4 py-6 sm:px-6">
      <PageHeader
        title="Saldos"
        description="Resumo de performance por conta de produto e depósito, derivado das movimentações."
      />
      <StatusMessage status={status} />

      <ScreenSection
        title="Filtros"
        actions={
          <Button disabled={loading} onClick={() => void loadSaldos()} type="button" variant="outline">
            Aplicar
          </Button>
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" onChange={(event) => setFilters((current) => ({ ...current, item_id: event.target.value }))} value={filters.item_id}>
            <option value="">Todos os itens</option>
            {itens.map((item) => <option key={item.id_item} value={item.id_item}>{item.nome}</option>)}
          </select>
          <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" onChange={(event) => setFilters((current) => ({ ...current, conta_produto_id: event.target.value }))} value={filters.conta_produto_id}>
            <option value="">Todas as contas</option>
            {contas.map((conta) => <option key={conta.id_conta_produto} value={conta.id_conta_produto}>{conta.nome}</option>)}
          </select>
          <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" onChange={(event) => setFilters((current) => ({ ...current, deposito_id: event.target.value }))} value={filters.deposito_id}>
            <option value="">Todos os depósitos</option>
            {depositos.map((deposito) => <option key={deposito.id_deposito} value={deposito.id_deposito}>{deposito.nome}</option>)}
          </select>
        </div>
      </ScreenSection>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <ScreenSection title="Visual de depósitos / silos" className="xl:col-span-2">
          {saldosDeposito.length ? (
            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {saldosDeposito.map((saldo) => (
                <SiloBalanceCard
                  key={saldo.id_saldo_deposito}
                  maxSaldoKg={maxSaldoDepositoKg}
                  saldo={saldo}
                />
              ))}
            </div>
          ) : (
            <EmptyState title={loading ? 'Carregando visual de saldos...' : undefined} />
          )}
        </ScreenSection>

        <ScreenSection title="Saldo por conta">
          {saldosConta.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conta</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Kg</TableHead>
                  <TableHead>Sacas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saldosConta.map((saldo) => (
                  <TableRow key={saldo.id_saldo_conta_produto}>
                    <TableCell className="font-semibold">{asText(saldo.conta_produto?.nome)}</TableCell>
                    <TableCell>{asText(saldo.item?.nome)}</TableCell>
                    <TableCell>{formatKg(saldo.saldo_kg)}</TableCell>
                    <TableCell>{formatSacas(saldo.saldo_sacas)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState title={loading ? 'Carregando saldos...' : undefined} />
          )}
        </ScreenSection>

        <ScreenSection title="Saldo por deposito">
          {saldosDeposito.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Depósito</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Kg</TableHead>
                  <TableHead>Sacas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saldosDeposito.map((saldo) => (
                  <TableRow key={saldo.id_saldo_deposito}>
                    <TableCell className="font-semibold">{asText(saldo.deposito?.nome)}</TableCell>
                    <TableCell>{asText(saldo.item?.nome)}</TableCell>
                    <TableCell>{formatKg(saldo.saldo_kg)}</TableCell>
                    <TableCell>{formatSacas(saldo.saldo_sacas)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState title={loading ? 'Carregando saldos...' : undefined} />
          )}
        </ScreenSection>
      </div>
    </section>
  )
}

export default SaldosPage
