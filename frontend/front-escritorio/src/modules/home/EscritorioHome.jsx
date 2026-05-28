import { Banknote, FileText, MapPinned, Users } from 'lucide-react'

const cards = [
  {
    id: 'entidades',
    title: 'Entidades',
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
    id: 'contratos',
    title: 'Contratos',
    description: 'Contratos preparados para integração futura com a balança.',
    icon: FileText,
  },
  {
    id: 'folha',
    title: 'Folha de Pagamento',
    description: 'Lançamentos, férias, salários e relatório mensal.',
    icon: Banknote,
  },
]

function EscritorioHome({ usuario, onNavigate }) {
  return (
    <main className="module-home">
      <section className="module-hero">
        <div>
          <span>Escritório</span>
          <h1>Área operacional</h1>
          <p>
            Escolha uma rotina para consultar cadastros, contratos e folha de
            pagamento.
          </p>
        </div>
        <strong>{usuario?.nome || 'Usuário'}</strong>
      </section>

      <section className="module-card-grid" aria-label="Rotinas do escritório">
        {cards.map((card) => (
          <button
            className="module-card"
            key={card.id}
            onClick={() => onNavigate(card.id)}
            type="button"
          >
            <span className="module-card-title">
              <card.icon aria-hidden="true" />
              <strong>{card.title}</strong>
            </span>
            <small>{card.description}</small>
          </button>
        ))}
      </section>
    </main>
  )
}

export default EscritorioHome
