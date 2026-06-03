export function numero(value: unknown) {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function decimal(value: unknown) {
  return numero(value).toFixed(2);
}
