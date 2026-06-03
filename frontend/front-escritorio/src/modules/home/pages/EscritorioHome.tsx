import { Banknote, MapPinned, Users } from 'lucide-react'
import { hasModuleAccess } from '@/modules/auth/services/auth.service'
import WorkspaceRoutineCard from '../components/WorkspaceRoutineCard'

const cards = [
  {
    id: 'entidades',
    title: 'Pessoas/Empresas',
    description: 'Pessoas, empresas, funcionários e cadastros base.',
    icon: Users,
  },
  {
    id: 'imoveis',
    title: 'Imóveis',
    description: 'Propriedades, matrículas, localização e anexos rurais.',
    icon: MapPinned,
  },
  {
    id: 'folha',
    title: 'Folha de Pagamento',
    description: 'Lançamentos, férias, salários e relatório mensal.',
    icon: Banknote,
  },
]

function EscritorioHome({ usuario, onNavigate }) {
  const visibleCards = cards.filter(
    (card) => card.id !== 'folha' || hasModuleAccess(usuario, 'FOLHA'),
  )

  return (
    <main className="grid gap-6 px-5 py-7 sm:px-7">
      <section className="flex flex-col gap-4 border-b border-emerald-100 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="text-xs font-black uppercase tracking-wide text-emerald-800">
            Escritório
          </span>
          <h1 className="mt-2 text-4xl font-bold leading-tight tracking-normal text-slate-950">
            Área operacional
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Escolha uma rotina para consultar cadastros e folha de pagamento.
          </p>
        </div>
        <strong className="inline-flex self-start rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-900 md:self-auto">
          {usuario?.nome || 'Usuário'}
        </strong>
      </section>

      <section
        className="grid gap-4 xl:grid-cols-3"
        aria-label="Rotinas do escritório"
      >
        {visibleCards.map((card) => (
          <WorkspaceRoutineCard
            card={card}
            key={card.id}
            onOpen={() => onNavigate(card.id)}
          />
        ))}
      </section>
    </main>
  )
}

export default EscritorioHome
