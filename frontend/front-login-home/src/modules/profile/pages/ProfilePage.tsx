import { useEffect, useState } from 'react'
import { ArrowLeft, Camera, Save, UserRound } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import StatusMessage from '@/shared/components/feedback/StatusMessage'
import { updateStoredUser } from '@/shared/services/api'
import { getCurrentUser } from '@/modules/auth/services/auth.service'
import { updateProfile, updateProfilePhoto } from '../services/profile.service'

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (!parts.length) {
    return 'U'
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function ProfilePage({ usuario, onBack, onUserUpdated }) {
  const [form, setForm] = useState({
    nome: usuario.nome || '',
    observacao: usuario.observacao || '',
  })
  const [photoFile, setPhotoFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(usuario.imagem_perfil_url || '')
  const [status, setStatus] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(
    () => () => {
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    },
    [previewUrl],
  )

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0] || null

    if (file && !file.type.startsWith('image/')) {
      setStatus({ type: 'warning', message: 'Selecione um arquivo de imagem.' })
      event.target.value = ''
      setPhotoFile(null)
      return
    }

    setPhotoFile(file)
    setPreviewUrl(file ? URL.createObjectURL(file) : usuario.imagem_perfil_url || '')
    setStatus(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setStatus(null)

    try {
      await updateProfile(usuario.usuario_id, {
        nome: form.nome,
        observacao: form.observacao || null,
      })

      if (photoFile) {
        await updateProfilePhoto(usuario.usuario_id, photoFile)
      }

      const refreshed = await getCurrentUser()
      updateStoredUser(refreshed)
      onUserUpdated(refreshed)
      setPhotoFile(null)
      setPreviewUrl(refreshed.imagem_perfil_url || '')
      setStatus({ type: 'success', message: 'Perfil atualizado.' })
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Button onClick={onBack} type="button" variant="outline">
          <ArrowLeft aria-hidden="true" />
          Voltar
        </Button>
        <div>
          <span className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">
            Minha conta
          </span>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">Meu perfil</h1>
        </div>
      </section>

      <Card>
        <CardHeader className="items-center text-center">
          <Avatar className="h-28 w-28 border-4 border-emerald-50 shadow-sm">
            <AvatarImage alt="" src={previewUrl} />
            <AvatarFallback className="text-2xl">
              {getInitials(form.nome || usuario.nome)}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="mt-2">Informações do perfil</CardTitle>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Atualize seus dados e envie uma foto para aparecer no menu.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form className="mx-auto grid max-w-xl gap-5" onSubmit={handleSubmit}>
            <StatusMessage status={status} />

            <div className="grid gap-2">
              <Label htmlFor="profile-photo">Foto</Label>
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-dashed border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm font-bold text-emerald-900 transition hover:bg-emerald-50">
                <span className="inline-flex min-w-0 items-center gap-2">
                  <Camera aria-hidden="true" className="h-5 w-5 shrink-0" />
                  <span className="truncate">
                    {photoFile?.name || 'Escolher foto do perfil'}
                  </span>
                </span>
                <span className="text-xs text-emerald-700">JPG, PNG, WEBP ou GIF</span>
                <input
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  id="profile-photo"
                  onChange={handlePhotoChange}
                  type="file"
                />
              </label>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="profile-name">Nome</Label>
              <div className="relative">
                <UserRound
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-700"
                />
                <Input
                  className="pl-9"
                  id="profile-name"
                  onChange={(event) => updateField('nome', event.target.value)}
                  required
                  type="text"
                  value={form.nome}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="profile-note">Observação</Label>
              <Textarea
                id="profile-note"
                onChange={(event) => updateField('observacao', event.target.value)}
                rows="4"
                value={form.observacao}
              />
            </div>

            <Button disabled={saving} type="submit">
              <Save aria-hidden="true" />
              {saving ? 'Salvando...' : 'Salvar perfil'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}

export default ProfilePage
