export function numero(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  return Number(value);
}

export function decimal(value: unknown, scale = 3) {
  return numero(value).toFixed(scale);
}

export function sacasFromKg(value: unknown) {
  return numero(value) / 60;
}
