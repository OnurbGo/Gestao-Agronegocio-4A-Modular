import { useState } from 'react'
import StatusMessage from '../../shared/components/StatusMessage'
import { updateStoredUser } from '../../shared/services/api'
import { getCurrentUser } from '../auth/auth.service'
import { updateProfile } from './profile.service'

function ProfilePage({ usuario, onBack, onUserUpdated }) {
  const [form, setForm] = useState({
    nome: usuario.nome || '',
    imagem_perfil_url: usuario.imagem_perfil_url || '',
    observacao: usuario.observacao || '',
  })
  const [status, setStatus] = useState(null)
  const [saving, setSaving] = useState(false)

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setStatus(null)

    try {
      await updateProfile(usuario.usuario_id, form)
      const refreshed = await getCurrentUser()
      updateStoredUser(refreshed)
      onUserUpdated(refreshed)
      setStatus({ type: 'success', message: 'Perfil atualizado.' })
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="settings-layout">
      <section className="section-heading">
        <button className="ghost-button" type="button" onClick={onBack}>
          Voltar
        </button>
        <div>
          <span>Minha conta</span>
          <h1>Meu perfil</h1>
        </div>
      </section>

      <form className="profile-form panel" onSubmit={handleSubmit}>
        <StatusMessage status={status} />
        <label>
          Nome
          <input
            onChange={(event) => updateField('nome', event.target.value)}
            required
            type="text"
            value={form.nome}
          />
        </label>
        <label>
          URL da foto
          <input
            onChange={(event) =>
              updateField('imagem_perfil_url', event.target.value)
            }
            type="url"
            value={form.imagem_perfil_url}
          />
        </label>
        <label>
          Observação
          <textarea
            onChange={(event) => updateField('observacao', event.target.value)}
            rows="4"
            value={form.observacao}
          />
        </label>
        <button className="primary-button" disabled={saving} type="submit">
          Salvar perfil
        </button>
      </form>
    </main>
  )
}

export default ProfilePage
