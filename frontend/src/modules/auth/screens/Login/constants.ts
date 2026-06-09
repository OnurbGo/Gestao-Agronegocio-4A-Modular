export const INITIAL_LOGIN = {
  email: '',
  senha: '',
}

export const INITIAL_REQUEST = {
  nome: '',
  email: '',
  senha: '',
  modulos_solicitados: ['ESCRITORIO'],
}

export const INITIAL_BOOTSTRAP = {
  nome: '',
  email: '',
  senha: '',
}

export const ENTERING_SYSTEM_DELAY_MS = 1500

export const MODE_OPTIONS = [
  { id: 'login', label: 'Entrar' },
  { id: 'request', label: 'Solicitar acesso' },
  { id: 'bootstrap', label: 'Primeiro acesso' },
] as const

export type LoginMode = (typeof MODE_OPTIONS)[number]['id']

export const MODE_CONTENT = {
  login: {
    title: 'Entre na sua conta',
    description: 'Use as credenciais liberadas pelo administrador.',
    submit: 'Entrar',
    loading: 'Entrando...',
  },
  request: {
    title: 'Solicitar acesso',
    description: 'Envie seus dados para análise do responsável.',
    submit: 'Enviar pedido',
    loading: 'Enviando...',
  },
  bootstrap: {
    title: 'Criar primeiro ADMIN',
    description: 'Disponível apenas quando o sistema ainda não possui contas.',
    submit: 'Criar admin',
    loading: 'Criando...',
  },
} satisfies Record<LoginMode, {
  title: string
  description: string
  submit: string
  loading: string
}>
