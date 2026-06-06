import { useEffect, useMemo, useState } from 'react'
import {
  ClipboardList,
  Layers3,
  PackageCheck,
  Scale,
  WalletCards,
} from 'lucide-react'
import StatusMessage from '@/components/feedback/StatusMessage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  dadosSaidaApi,
  lotesApi,
  pesagensApi,
  relatoriosApi,
} from '@/services/silo.service'
import type {
  AuthUser,
  DadosSaidaPesagem,
  LoteOperacional,
  Pesagem,
  SaldoContaProduto,
  SaldoDeposito,
  StatusMessageState,
} from '@/types'
import {
  asText,
  formatKg,
  formatNumber,
  formatSacas,
} from '@/utils/formatters'
import type { SiloView } from '@/navigation/components/SiloShell'
import PageHeader from '@/screens/_shared/PageHeader'
import ScreenSection from '@/screens/_shared/ScreenSection'

type SiloHomeProps = {
  usuario: AuthUser
  onNavigate: (view: SiloView) => void
}

type DashboardState = {
  saldosConta: SaldoContaProduto[]
  saldosDeposito: SaldoDeposito[]
  lotes: LoteOperacional[]
  pesagens: Pesagem[]
  dadosSaida: DadosSaidaPesagem[]
}

const initialState: DashboardState = {
  saldosConta: [],
  saldosDeposito: [],
  lotes: [],
  pesagens: [],
  dadosSaida: [],
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Nao foi possivel carregar o dashboard.'
}

function sumKg(items: Array<{ saldo_kg?: string | number | null }>) {
  return items.reduce((total, item) => total + Number(item.saldo_kg || 0), 0)
}

function SummaryCard({
  title,
  value,
  detail,
  icon: Icon,
  onClick,
}: {
  title: string
  value: string
  detail: string
  icon: typeof PackageCheck
  onClick: () => void
}) {
  return (
    <button
      className="rounded-lg border border-emerald-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow"
      onClick={onClick}
      type="button"
    >
      <span className="mb-4 grid h-10 w-10 place-items-center rounded-md bg-emerald-700 text-white">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <span className="block text-sm font-bold text-slate-500">{title}</span>
      <span className="mt-1 block text-2xl font-bold text-emerald-950">
        {value}
      </span>
      <span className="mt-2 block text-sm text-slate-600">{detail}</span>
    </button>
  )
}

function SiloHome({ usuario, onNavigate }: SiloHomeProps) {
  const [dashboard, setDashboard] = useState<DashboardState>(initialState)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<StatusMessageState>(null)

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      setLoading(true)
      setStatus(null)

      try {
        const [
          saldosConta,
          saldosDeposito,
          lotes,
          pesagens,
          dadosSaida,
        ] = await Promise.all([
          relatoriosApi.saldosConta({ limit: 8 }),
          relatoriosApi.saldosDeposito({ limit: 8 }),
          lotesApi.list({ limit: 8 }),
          pesagensApi.list({ limit: 8 }),
          dadosSaidaApi.list({ limit: 8 }),
        ])

        if (!active) return
        setDashboard({
          saldosConta: normalizePaginated(saldosConta, 8).items,
          saldosDeposito: normalizePaginated(saldosDeposito, 8).items,
          lotes: normalizePaginated(lotes, 8).items,
          pesagens: normalizePaginated(pesagens, 8).items,
          dadosSaida: normalizePaginated(dadosSaida, 8).items,
        })
      } catch (error) {
        if (active) setStatus({ type: 'error', message: toErrorMessage(error) })
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadDashboard()

    return () => {
      active = false
    }
  }, [])

  const metrics = useMemo(() => {
    const lotesAbertos = dashboard.lotes.filter(
      (lote) => !['FECHADO', 'CANCELADO'].includes(String(lote.status || '')),
    )
    const pendentesClassificacao = dashboard.pesagens.filter(
      (pesagem) =>
        !pesagem.classificacao &&
        ['PESAGEM_2_REALIZADA', 'PESAGEM_2_REGISTRADA'].includes(
          String(pesagem.status || ''),
        ),
    )

    return {
      saldoContaKg: sumKg(dashboard.saldosConta),
      saldoDepositoKg: sumKg(dashboard.saldosDeposito),
      lotesAbertos: lotesAbertos.length,
      pendentesClassificacao: pendentesClassificacao.length,
      dadosSaida: dashboard.dadosSaida.length,
    }
  }, [dashboard])

  return (
    <section className="px-4 py-6 sm:px-6">
      <PageHeader
        title="Dashboard do Silo"
        description={`Operacao web do modulo Silo para ${usuario.nome || 'usuario autenticado'}.`}
      />

      <StatusMessage status={status} />

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          detail="Resumo por conta"
          icon={WalletCards}
          onClick={() => onNavigate('saldos')}
          title="Saldo contas"
          value={formatKg(metrics.saldoContaKg)}
        />
        <SummaryCard
          detail="Resumo por silo/deposito"
          icon={PackageCheck}
          onClick={() => onNavigate('saldos')}
          title="Saldo depositos"
          value={formatKg(metrics.saldoDepositoKg)}
        />
        <SummaryCard
          detail="Lotes em operacao"
          icon={Layers3}
          onClick={() => onNavigate('lotes')}
          title="Lotes abertos"
          value={formatNumber(metrics.lotesAbertos)}
        />
        <SummaryCard
          detail="Aguardando umidade/impureza"
          icon={Scale}
          onClick={() => onNavigate('classificacao')}
          title="Classificacao"
          value={formatNumber(metrics.pendentesClassificacao)}
        />
        <SummaryCard
          detail="Complementos recentes"
          icon={ClipboardList}
          onClick={() => onNavigate('dados-saida')}
          title="Dados saida"
          value={formatNumber(metrics.dadosSaida)}
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <ScreenSection
          title="Lotes recentes"
          actions={
            <Button onClick={() => onNavigate('lotes')} type="button" variant="outline">
              Abrir lotes
            </Button>
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lote</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboard.lotes.map((lote) => (
                <TableRow key={lote.id_lote_operacional}>
                  <TableCell className="font-semibold">{lote.nome || '-'}</TableCell>
                  <TableCell>{lote.tipo || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={lote.status === 'FECHADO' ? 'secondary' : 'default'}>
                      {lote.status || '-'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {!dashboard.lotes.length ? (
                <TableRow>
                  <TableCell className="text-slate-500" colSpan={3}>
                    {loading ? 'Carregando...' : 'Nenhum lote localizado.'}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </ScreenSection>

        <ScreenSection
          title="Pesagens recentes"
          actions={
            <Button onClick={() => onNavigate('pesagens')} type="button" variant="outline">
              Abrir pesagens
            </Button>
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Romaneio</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead>Peso final</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboard.pesagens.map((pesagem) => (
                <TableRow key={pesagem.id_pesagem}>
                  <TableCell className="font-semibold">
                    {pesagem.numero_romaneio || '-'}
                  </TableCell>
                  <TableCell>{asText(pesagem.conta_produto?.nome)}</TableCell>
                  <TableCell>
                    {formatSacas(pesagem.classificacao?.sacas_final)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{pesagem.status || '-'}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {!dashboard.pesagens.length ? (
                <TableRow>
                  <TableCell className="text-slate-500" colSpan={4}>
                    {loading ? 'Carregando...' : 'Nenhuma pesagem localizada.'}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </ScreenSection>
      </div>
    </section>
  )
}

export default SiloHome
