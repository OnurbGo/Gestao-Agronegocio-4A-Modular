import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { createFirstAccount, login, requestAccess } from '@/shared/services/auth.service'
import type { AuthUser, StatusMessageState } from '@/shared/types'
import {
  ENTERING_SYSTEM_DELAY_MS,
  INITIAL_BOOTSTRAP,
  INITIAL_LOGIN,
  INITIAL_REQUEST,
  MODE_CONTENT,
  type LoginMode,
} from '../constants'

type UseLoginAccessArgs = {
  onAuthenticated: (usuario: AuthUser) => void
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Nao foi possivel concluir a acao.'
}

export function useLoginAccess({ onAuthenticated }: UseLoginAccessArgs) {
  const [mode, setMode] = useState<LoginMode>('login')
  const [loginForm, setLoginForm] = useState(INITIAL_LOGIN)
  const [requestForm, setRequestForm] = useState(INITIAL_REQUEST)
  const [bootstrapForm, setBootstrapForm] = useState(INITIAL_BOOTSTRAP)
  const [status, setStatus] = useState<StatusMessageState>(null)
  const [submitting, setSubmitting] = useState(false)
  const [enteringSystem, setEnteringSystem] = useState(false)
  const redirectTimeoutRef = useRef<number | null>(null)

  const content = MODE_CONTENT[mode]

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current)
      }
    }
  }, [])

  function startAuthenticatedTransition(usuario: AuthUser) {
    if (redirectTimeoutRef.current) {
      window.clearTimeout(redirectTimeoutRef.current)
    }

    setStatus(null)
    setEnteringSystem(true)
    redirectTimeoutRef.current = window.setTimeout(() => {
      redirectTimeoutRef.current = null
      onAuthenticated(usuario)
    }, ENTERING_SYSTEM_DELAY_MS)
  }

  function changeMode(nextMode: LoginMode) {
    setMode(nextMode)
    setStatus(null)
  }

  function updateLogin(field: keyof typeof INITIAL_LOGIN, value: string) {
    setLoginForm((current) => ({ ...current, [field]: value }))
  }

  function updateRequest(
    field: Exclude<keyof typeof INITIAL_REQUEST, 'modulos_solicitados'>,
    value: string,
  ) {
    setRequestForm((current) => ({ ...current, [field]: value }))
  }

  function updateBootstrap(field: keyof typeof INITIAL_BOOTSTRAP, value: string) {
    setBootstrapForm((current) => ({ ...current, [field]: value }))
  }

  function toggleRequestedModule(moduleId: string) {
    setRequestForm((current) => {
      const exists = current.modulos_solicitados.includes(moduleId)
      const modulos = exists
        ? current.modulos_solicitados.filter((item) => item !== moduleId)
        : [...current.modulos_solicitados, moduleId]

      return {
        ...current,
        modulos_solicitados: modulos.length ? modulos : ['ESCRITORIO'],
      }
    })
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setStatus(null)

    try {
      const usuario = await login(loginForm)
      startAuthenticatedTransition(usuario)
    } catch (error) {
      setStatus({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRequestAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setStatus(null)

    try {
      await requestAccess(requestForm)
      setRequestForm(INITIAL_REQUEST)
      setMode('login')
      setStatus({
        type: 'success',
        message: 'Pedido enviado. Aguarde a análise do administrador.',
      })
    } catch (error) {
      setStatus({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleBootstrap(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setStatus(null)

    try {
      await createFirstAccount(bootstrapForm)
      const usuario = await login({
        email: bootstrapForm.email,
        senha: bootstrapForm.senha,
      })
      startAuthenticatedTransition(usuario)
    } catch (error) {
      setStatus({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setSubmitting(false)
    }
  }

  return {
    bootstrapForm,
    changeMode,
    content,
    enteringSystem,
    handleBootstrap,
    handleLogin,
    handleRequestAccess,
    loginForm,
    mode,
    requestForm,
    status,
    submitting,
    toggleRequestedModule,
    updateBootstrap,
    updateLogin,
    updateRequest,
  }
}
