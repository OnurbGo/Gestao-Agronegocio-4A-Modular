export type TipoPessoa = "FISICA" | "JURIDICA";

export function onlyDigits(value: unknown): string {
  return typeof value === "string" ? value.replace(/\D/g, "") : "";
}

function hasRepeatedDigits(value: string): boolean {
  return /^(\d)\1+$/.test(value);
}

export function isValidCpf(value: unknown): boolean {
  const cpf = onlyDigits(value);

  if (cpf.length !== 11 || hasRepeatedDigits(cpf)) {
    return false;
  }

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += Number(cpf[index]) * (10 - index);
  }

  let digit = (sum * 10) % 11;
  if (digit === 10) {
    digit = 0;
  }

  if (digit !== Number(cpf[9])) {
    return false;
  }

  sum = 0;
  for (let index = 0; index < 10; index += 1) {
    sum += Number(cpf[index]) * (11 - index);
  }

  digit = (sum * 10) % 11;
  if (digit === 10) {
    digit = 0;
  }

  return digit === Number(cpf[10]);
}

function getCnpjDigit(cnpj: string, weights: number[]): number {
  const sum = weights.reduce(
    (total, weight, index) => total + Number(cnpj[index]) * weight,
    0,
  );
  const remainder = sum % 11;

  return remainder < 2 ? 0 : 11 - remainder;
}

export function isValidCnpj(value: unknown): boolean {
  const cnpj = onlyDigits(value);

  if (cnpj.length !== 14 || hasRepeatedDigits(cnpj)) {
    return false;
  }

  const firstDigit = getCnpjDigit(
    cnpj,
    [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  const secondDigit = getCnpjDigit(
    cnpj,
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );

  return firstDigit === Number(cnpj[12]) && secondDigit === Number(cnpj[13]);
}

export function isValidDocumentoPessoa(
  value: unknown,
  tipoPessoa?: unknown,
): boolean {
  if (tipoPessoa === "FISICA") {
    return isValidCpf(value);
  }

  if (tipoPessoa === "JURIDICA") {
    return isValidCnpj(value);
  }

  return false;
}

