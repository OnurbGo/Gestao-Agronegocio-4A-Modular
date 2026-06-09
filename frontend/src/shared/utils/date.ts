export function formatDateBR(value?: string | Date | null): string {
  if (!value) return "-"

  if (value instanceof Date) {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(value)
  }

  const text = String(value)
  const isoDate = text.match(/^(\d{4})-(\d{2})-(\d{2})/)

  if (isoDate) {
    return `${isoDate[3]}/${isoDate[2]}/${isoDate[1]}`
  }

  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return text

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

export function formatDateTimeBR(value?: string | Date | null): string {
  if (!value) return "-"

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

