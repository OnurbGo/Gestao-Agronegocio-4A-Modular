function DocumentosPage({ onBack, onNavigate }) {
  return (
    <main className="workspace-page">
      <section className="page-heading">
        <button className="ghost-button" onClick={onBack} type="button">
          Voltar
        </button>
        <div>
          <span>Arquivos</span>
          <h1>Anexos</h1>
        </div>
      </section>

      <section className="module-card-grid compact">
        <button
          className="module-card"
          onClick={() => onNavigate('entidades')}
          type="button"
        >
          <span>Entidades</span>
          <strong>Anexar em entidades</strong>
          <small>Abra uma entidade para enviar, baixar ou remover documentos.</small>
        </button>
        <button
          className="module-card"
          onClick={() => onNavigate('imoveis')}
          type="button"
        >
          <span>Imoveis</span>
          <strong>Anexar em imoveis</strong>
          <small>Abra um imóvel para administrar matrícula e outros arquivos.</small>
        </button>
      </section>
    </main>
  )
}

export default DocumentosPage
