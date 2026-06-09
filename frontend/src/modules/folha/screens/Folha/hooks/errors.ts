import { getApiErrorMessage } from "@/shared/services/api-error";

export function getErrorMessage(error: unknown, fallback: string): string {
  return getApiErrorMessage(error, fallback);
}
