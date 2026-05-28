import { requestJson } from '../../shared/services/api'

export function getCurrentUser() {
  return requestJson('/api/core/auth/me')
}

export function hasEscritorioAccess(usuario) {
  if (usuario?.possuiAdmin || usuario?.possuiGerente) {
    return true
  }

  return Boolean(
    usuario?.modulos?.some(
      (permissao) =>
        permissao.modulo === 'ESCRITORIO' && permissao.pode_visualizar,
    ),
  )
}
