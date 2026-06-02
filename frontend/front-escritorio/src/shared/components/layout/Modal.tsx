import { X } from 'lucide-react'

function Modal({ children, onClose, title, width = 'md' }) {
  const sizeClass = width === 'lg' ? 'modal-panel large' : 'modal-panel'

  return (
    <div
      aria-modal="true"
      className="modal-backdrop"
      onMouseDown={onClose}
      role="dialog"
    >
      <section className={sizeClass} onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <h2>{title}</h2>
          <button
            aria-label="Fechar"
            className="icon-button"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" />
          </button>
        </header>
        {children}
      </section>
    </div>
  )
}

export default Modal
