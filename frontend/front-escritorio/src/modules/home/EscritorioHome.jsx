const cards = [
  {
    id: 'entidades',
    title: 'Entidades',
    description: 'Pessoas, empresas, funcionários e participantes da folha.',
    metric: 'Cadastro base',
  },
  {
    id: 'imoveis',
    title: 'Imoveis',
    description: 'Propriedades, matrículas, localização e anexos rurais.',
    metric: 'Rural',
  },
  {
    id: 'documentos',
    title: 'Anexos',
    description: 'Documentos vinculados a entidades e imóveis.',
    metric: 'Arquivos',
  },
  {
    id: 'contratos',
    title: 'Contratos',
    description: 'Contratos preparados para integração futura com a balança.',
    metric: 'Safra',
  },
  {
    id: 'folha',
    title: 'Folha de Pagamento',
    description: 'Lançamentos, férias, salários e relatório mensal.',
    metric: 'Financeiro',
  },
]

function EscritorioHome({ usuario, onNavigate }) {
  return (
    <main className="module-home">
      <section className="module-hero">
        <div>
          <span>Escritorio</span>
          <h1>Área operacional</h1>
          <p>
            Escolha uma rotina para consultar cadastros, documentos, contratos ou a
            folha de pagamento.
          </p>
        </div>
        <strong>{usuario?.nome || 'Usuario'}</strong>
      </section>

      <section className="module-card-grid" aria-label="Rotinas do escritorio">
        {cards.map((card) => (
          <button
            className="module-card"
            key={card.id}
            onClick={() => onNavigate(card.id)}
            type="button"
          >
            <span>{card.metric}</span>
            <strong>{card.title}</strong>
            <small>{card.description}</small>
          </button>
        ))}
      </section>
    </main>
  )
}

export default EscritorioHome
