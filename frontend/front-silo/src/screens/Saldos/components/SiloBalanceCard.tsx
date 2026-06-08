import { PackageCheck } from 'lucide-react'
import type { SaldoDeposito } from '@/types'
import { asText, formatKg, formatSacas } from '@/utils/formatters'

type SiloBalanceCardProps = {
  saldo: SaldoDeposito
  maxSaldoKg: number
}

function SiloBalanceCard({ saldo, maxSaldoKg }: SiloBalanceCardProps) {
  const saldoKg = Number(saldo.saldo_kg || 0)
  const percent = maxSaldoKg > 0 ? Math.max(8, (saldoKg / maxSaldoKg) * 100) : 8

  return (
    <div className="grid gap-4 rounded-lg border border-emerald-100 bg-white p-4 shadow-sm sm:grid-cols-[76px_minmax(0,1fr)]">
      <div className="relative h-32 rounded-b-[28px] rounded-t-md border-2 border-emerald-800 bg-emerald-50">
        <div
          className="absolute bottom-0 left-0 right-0 rounded-b-[24px] bg-emerald-600 transition-all"
          style={{ height: `${Math.min(percent, 100)}%` }}
        />
        <div className="absolute inset-0 grid place-items-center">
          <PackageCheck className="h-6 w-6 text-emerald-950" />
        </div>
      </div>

      <div className="min-w-0">
        <p className="text-sm font-bold text-emerald-950">
          {asText(saldo.deposito?.nome, 'Depósito sem nome')}
        </p>
        <p className="mt-1 text-sm text-slate-600">{asText(saldo.item?.nome, 'Item')}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-md bg-slate-50 px-3 py-2">
            <span className="block text-xs font-bold text-slate-500">Saldo kg</span>
            <span className="font-bold text-slate-900">{formatKg(saldo.saldo_kg)}</span>
          </div>
          <div className="rounded-md bg-slate-50 px-3 py-2">
            <span className="block text-xs font-bold text-slate-500">Sacas</span>
            <span className="font-bold text-slate-900">{formatSacas(saldo.saldo_sacas)}</span>
          </div>
        </div>
        <p className="mt-3 text-xs font-semibold text-slate-500">
          Capacidade não cadastrada. Preenchimento proporcional ao maior saldo filtrado.
        </p>
      </div>
    </div>
  )
}

export default SiloBalanceCard
