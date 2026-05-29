import { requestJson } from '../../shared/services/api'

export function getCurrentUser() {
  return requestJson('/api/core/auth/me')
}

export function hasModuleAccess(usuario, moduleId) {
  if (usuario?.possuiAdmin || usuario?.possuiGerente) {
    return true
  }

  return Boolean(
    usuario?.modulos?.some(
      (permissao) =>
        permissao.modulo === moduleId && permissao.pode_visualizar,
    ),
  )
}

export function hasEscritorioAccess(usuario) {
  return hasModuleAccess(usuario, 'ESCRITORIO')
}
