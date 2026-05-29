import { Banknote, MapPinned, Users } from 'lucide-react'
import { hasModuleAccess } from '../auth/auth.service'
import WorkspaceRoutineCard from './WorkspaceRoutineCard'

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
    <main className="module-home">
      <section className="module-hero">
        <div>
          <span>Escritório</span>
          <h1>Área operacional</h1>
          <p>Escolha uma rotina para consultar cadastros e folha de pagamento.</p>
        </div>
        <strong>{usuario?.nome || 'Usuário'}</strong>
      </section>

      <section className="module-card-grid" aria-label="Rotinas do escritório">
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
