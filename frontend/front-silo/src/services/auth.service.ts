import { requestJson } from '@/services/api'
import type { AuthUser } from '@/types'

export function getCurrentUser(): Promise<AuthUser> {
  return requestJson<AuthUser>('/api/core/auth/me')
}

export function hasModuleAccess(
  usuario: AuthUser | null | undefined,
  moduleId: string,
): boolean {
  if (usuario?.possuiAdmin || usuario?.possuiGerente) return true

  return Boolean(
    usuario?.modulos?.some(
      (permissao) =>
        permissao.modulo === moduleId && permissao.pode_visualizar,
    ),
  )
}

export function canCreate(usuario: AuthUser | null | undefined, moduleId: string) {
  if (usuario?.possuiAdmin || usuario?.possuiGerente) return true
  return Boolean(
    usuario?.modulos?.some(
      (permissao) => permissao.modulo === moduleId && permissao.pode_criar,
    ),
  )
}

export function canEdit(usuario: AuthUser | null | undefined, moduleId: string) {
  if (usuario?.possuiAdmin || usuario?.possuiGerente) return true
  return Boolean(
    usuario?.modulos?.some(
      (permissao) => permissao.modulo === moduleId && permissao.pode_editar,
    ),
  )
}

export function hasSiloAccess(usuario: AuthUser | null | undefined): boolean {
  return (
    hasModuleAccess(usuario, 'SILO') ||
    hasModuleAccess(usuario, 'LANCAMENTOS_SILO') ||
    hasModuleAccess(usuario, 'BALANCA') ||
    hasModuleAccess(usuario, 'CLASSIFICACAO')
  )
}
