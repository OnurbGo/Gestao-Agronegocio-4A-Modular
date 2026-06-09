import { useCallback, useEffect, useState } from "react";
import { normalizePaginated } from "@/shared/services/api";
import { SALARY_PAGE_SIZE } from "../constants";
import { listarRegistrosSalariais } from "@/shared/services/folha.service";
import type { SalaryRecord } from "@/shared/types";
import { getErrorMessage } from "./errors";

type UseSalaryRecordsArgs = {
  page: number;
  participantId: number | null;
  onError: (message: string) => void;
};

export function useSalaryRecords({
  page,
  participantId,
  onError,
}: UseSalaryRecordsArgs) {
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [meta, setMeta] = useState(() =>
    normalizePaginated<SalaryRecord>([], SALARY_PAGE_SIZE),
  );

  const reset = useCallback(() => {
    setRecords([]);
    setMeta(normalizePaginated<SalaryRecord>([], SALARY_PAGE_SIZE));
  }, []);

  const reload = useCallback(async (pageOverride = page) => {
    if (!participantId) {
      reset();
      return null;
    }

    try {
      const data = normalizePaginated(
        await listarRegistrosSalariais(participantId, {
          page: pageOverride,
          limit: SALARY_PAGE_SIZE,
        }),
        SALARY_PAGE_SIZE,
      );

      setRecords(data.items);
      setMeta(data);
      return data;
    } catch (error) {
      onError(getErrorMessage(error, "Falha ao carregar registros salariais."));
      return null;
    }
  }, [onError, page, participantId, reset]);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!participantId) {
        if (active) reset();
        return;
      }

      try {
        const data = normalizePaginated(
          await listarRegistrosSalariais(participantId, {
            page,
            limit: SALARY_PAGE_SIZE,
          }),
          SALARY_PAGE_SIZE,
        );

        if (!active) return;
        setRecords(data.items);
        setMeta(data);
      } catch (error) {
        if (active) {
          onError(
            getErrorMessage(error, "Falha ao carregar registros salariais."),
          );
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [onError, page, participantId, reset]);

  return {
    recarregarSalarios: reload,
    registrosSalariais: records,
    salarioMeta: meta,
  };
}
