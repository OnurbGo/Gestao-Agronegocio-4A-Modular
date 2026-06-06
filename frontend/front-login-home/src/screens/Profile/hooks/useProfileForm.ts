import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { updateStoredUser } from '@/services/api'
import { getCurrentUser } from '@/services/auth.service'
import { updateProfile, updateProfilePhoto } from '@/services/profile.service'
import type { AuthUser, StatusMessageState } from '@/types'

type ProfileForm = {
  nome: string
  observacao: string
}

type UseProfileFormArgs = {
  usuario: AuthUser
  onUserUpdated: (usuario: AuthUser) => void
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Nao foi possivel concluir a acao.'
}

export function useProfileForm({ usuario, onUserUpdated }: UseProfileFormArgs) {
  const [form, setForm] = useState<ProfileForm>({
    nome: usuario.nome || '',
    observacao: usuario.observacao || '',
  })
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState(usuario.imagem_perfil_url || '')
  const [status, setStatus] = useState<StatusMessageState>(null)
  const [saving, setSaving] = useState(false)

  useEffect(
    () => () => {
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    },
    [previewUrl],
  )

  function updateField(field: keyof ProfileForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
      setStatus({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setSaving(false)
    }
  }

  return {
    form,
    handlePhotoChange,
    handleSubmit,
    photoFile,
    previewUrl,
    saving,
    status,
    updateField,
  }
}
