import { useState } from 'react'
import {
  BarChart3,
  ClipboardList,
  Factory,
  FileText,
  Home,
  Layers3,
  MapPin,
  PackageCheck,
  Scale,
  SlidersHorizontal,
  Truck,
  WalletCards,
  Warehouse,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { hasModuleAccess } from '@/services/auth.service'
import type { AuthUser } from '@/types'
import { resolveLoginHomeUrl } from '@/utils/frontend-url'
import ClassificacaoPage from '@/screens/Classificacao'
import ContasProdutoPage from '@/screens/ContasProduto'
import ContratosPage from '@/screens/Contratos'
import DadosSaidaPage from '@/screens/DadosSaida'
import DepositosPage from '@/screens/Depositos'
import DestinosPage from '@/screens/Destinos'
import EmissoresPage from '@/screens/Emissores'
import SiloHome from '@/screens/Home'
import ItensPage from '@/screens/Itens'
import LotesOperacionaisPage from '@/screens/LotesOperacionais'
import PesagensPage from '@/screens/Pesagens'
import RelatoriosPage from '@/screens/Relatorios'
import SaldosPage from '@/screens/Saldos'
import TabelasDescontoPage from '@/screens/TabelasDesconto'
import TransportadorasPage from '@/screens/Transportadoras'

export type SiloView =
  | 'home'
  | 'contas'
  | 'itens'
  | 'transportadoras'
  | 'emissores'
  | 'depositos'
  | 'destinos'
  | 'descontos'
  | 'lotes'
  | 'pesagens'
  | 'classificacao'
  | 'dados-saida'
  | 'contratos'
  | 'saldos'
  | 'relatorios'

type SiloShellProps = {
  usuario: AuthUser
}

const navItems = [
  { id: 'home', label: 'Dashboard', icon: BarChart3 },
  { id: 'contas', label: 'Contas produto', icon: WalletCards, module: 'SILO' },
  { id: 'itens', label: 'Itens', icon: PackageCheck, module: 'SILO' },
  { id: 'transportadoras', label: 'Transportadoras', icon: Truck, module: 'SILO' },
  { id: 'emissores', label: 'Emissores', icon: FileText, module: 'SILO' },
  { id: 'depositos', label: 'Depósitos/Silos', icon: Warehouse, module: 'SILO' },
  { id: 'destinos', label: 'Destinos', icon: MapPin, module: 'SILO' },
  { id: 'descontos', label: 'Descontos', icon: SlidersHorizontal, module: 'CLASSIFICACAO' },
  { id: 'lotes', label: 'Lotes', icon: Layers3, module: 'LANCAMENTOS_SILO' },
  { id: 'pesagens', label: 'Pesagens', icon: Scale, module: 'BALANCA' },
  { id: 'classificacao', label: 'Classificação', icon: ClipboardList, module: 'CLASSIFICACAO' },
  { id: 'dados-saida', label: 'Dados de saída', icon: Truck, module: 'LANCAMENTOS_SILO' },
  { id: 'contratos', label: 'Contratos', icon: FileText, managerOnly: true },
  { id: 'saldos', label: 'Saldos', icon: BarChart3, module: 'LANCAMENTOS_SILO' },
  { id: 'relatorios', label: 'Relatórios', icon: ClipboardList, module: 'LANCAMENTOS_SILO' },
] satisfies Array<{
  id: SiloView
  label: string
  icon: typeof BarChart3
  module?: string
  managerOnly?: boolean
}>

function canShowItem(usuario: AuthUser, item: (typeof navItems)[number]) {
  if (item.id === 'home') return true
  if (item.managerOnly) return Boolean(usuario.possuiAdmin || usuario.possuiGerente)
  return hasModuleAccess(usuario, item.module || 'SILO')
}

function SiloShell({ usuario }: SiloShellProps) {
  const [view, setView] = useState<SiloView>('home')
  const visibleItems = navItems.filter((item) => canShowItem(usuario, item))

  function renderView() {
    if (view === 'contas') return <ContasProdutoPage usuario={usuario} />
    if (view === 'itens') return <ItensPage usuario={usuario} />
    if (view === 'transportadoras') return <TransportadorasPage usuario={usuario} />
    if (view === 'emissores') return <EmissoresPage usuario={usuario} />
    if (view === 'depositos') return <DepositosPage usuario={usuario} />
    if (view === 'destinos') return <DestinosPage usuario={usuario} />
    if (view === 'descontos') return <TabelasDescontoPage usuario={usuario} />
    if (view === 'lotes') return <LotesOperacionaisPage usuario={usuario} />
    if (view === 'pesagens') return <PesagensPage />
    if (view === 'classificacao') return <ClassificacaoPage />
    if (view === 'dados-saida') return <DadosSaidaPage usuario={usuario} />
    if (view === 'contratos') return <ContratosPage usuario={usuario} />
    if (view === 'saldos') return <SaldosPage />
    if (view === 'relatorios') return <RelatoriosPage />
    return <SiloHome usuario={usuario} onNavigate={setView} />
  }

  return (
    <div className="min-h-screen bg-[#f4f7f2] text-slate-900">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-emerald-100 bg-white/95 px-4 py-5 shadow-sm backdrop-blur sm:px-6">
        <button
          className="inline-flex items-center gap-4 rounded-md px-2 py-3 text-left font-bold text-emerald-900 transition hover:bg-emerald-50"
          onClick={() => setView('home')}
          type="button"
        >
          <span className="grid h-12 w-12 place-items-center rounded-md bg-emerald-700 text-white">
            <Factory aria-hidden="true" className="h-6 w-6" />
          </span>
          <span className="text-lg">Silo</span>
        </button>

        <div className="flex items-center gap-4">
          <span className="hidden text-sm font-semibold text-slate-600 sm:inline">
            {usuario.nome}
          </span>
          <Button
            onClick={() => {
              window.location.href = resolveLoginHomeUrl(
                import.meta.env.VITE_LOGIN_HOME_URL,
              )
            }}
            type="button"
            variant="outline"
          >
            <Home aria-hidden="true" className="h-4 w-4" />
            Home
          </Button>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-89px)] lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-b border-emerald-100 bg-white px-4 py-4 lg:border-b-0 lg:border-r">
          <nav className="grid gap-1" aria-label="Rotinas do Silo">
            {visibleItems.map((item) => {
              const Icon = item.icon
              const active = view === item.id
              return (
                <button
                  className={`inline-flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-bold transition ${
                    active
                      ? 'bg-emerald-700 text-white'
                      : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-900'
                  }`}
                  key={item.id}
                  onClick={() => setView(item.id)}
                  type="button"
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                  {item.label}
                </button>
              )
            })}
          </nav>
        </aside>

        <main className="min-w-0">{renderView()}</main>
      </div>
    </div>
  )
}

export default SiloShell
