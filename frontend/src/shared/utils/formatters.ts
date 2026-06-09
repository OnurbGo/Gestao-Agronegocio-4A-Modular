export function formatNumber(value: unknown, digits = 2) {
  const number = Number(value || 0)
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(number) ? number : 0)
}

export function formatKg(value: unknown) {
  return `${formatNumber(value, 3)} kg`
}

export function formatSacas(value: unknown) {
  return `${formatNumber(value, 3)} sc`
}

export function formatPercent(value: unknown) {
  return `${formatNumber(value, 2)}%`
}

export function formatMoney(value: unknown) {
  const number = Number(value || 0)
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number.isFinite(number) ? number : 0)
}

export function formatDateTime(value: unknown) {
  if (!value) return '-'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export function formatBoolean(value: unknown, truthy = 'Ativo', falsy = 'Inativo') {
  return value ? truthy : falsy
}

export function asText(value: unknown, fallback = '-') {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

export function toNumberOrUndefined(value: string) {
  if (value === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}
