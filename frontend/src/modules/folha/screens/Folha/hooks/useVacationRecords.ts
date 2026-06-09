import { useCallback, useEffect, useState } from "react";
import { normalizePaginated } from "@/shared/services/api";
import { VACATION_PAGE_SIZE, feriasSummaryInicial } from "../constants";
import { listarFerias } from "@/shared/services/folha.service";
import type { VacationRecord, VacationSummary } from "@/shared/types";
import { getErrorMessage } from "./errors";

type UseVacationRecordsArgs = {
  page: number;
  participantId: number | null;
  onError: (message: string) => void;
};

function extractSummary(payload: unknown): VacationSummary {
  return Array.isArray(payload)
    ? feriasSummaryInicial
    : (payload as { summary?: VacationSummary }).summary || feriasSummaryInicial;
}

export function useVacationRecords({
  page,
  participantId,
  onError,
}: UseVacationRecordsArgs) {
  const [records, setRecords] = useState<VacationRecord[]>([]);
  const [meta, setMeta] = useState(() =>
    normalizePaginated<VacationRecord>([], VACATION_PAGE_SIZE),
  );
  const [summary, setSummary] = useState(feriasSummaryInicial);

  const reset = useCallback(() => {
    setRecords([]);
    setMeta(normalizePaginated<VacationRecord>([], VACATION_PAGE_SIZE));
    setSummary(feriasSummaryInicial);
  }, []);

  const reload = useCallback(async (pageOverride = page) => {
    if (!participantId) {
      reset();
      return null;
    }

    try {
      const payload = await listarFerias(participantId, {
        page: pageOverride,
        limit: VACATION_PAGE_SIZE,
      });
      const data = normalizePaginated(payload, VACATION_PAGE_SIZE);

      setRecords(data.items);
      setMeta(data);
      setSummary(extractSummary(payload));
      return data;
    } catch (error) {
      onError(getErrorMessage(error, "Falha ao carregar férias."));
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
        const payload = await listarFerias(participantId, {
          page,
          limit: VACATION_PAGE_SIZE,
        });
        const data = normalizePaginated(payload, VACATION_PAGE_SIZE);

        if (!active) return;
        setRecords(data.items);
        setMeta(data);
        setSummary(extractSummary(payload));
      } catch (error) {
        if (active) {
          onError(getErrorMessage(error, "Falha ao carregar férias."));
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [onError, page, participantId, reset]);

  return {
    ferias: records,
    feriasMeta: meta,
    feriasSummary: summary,
    recarregarFerias: reload,
  };
}
