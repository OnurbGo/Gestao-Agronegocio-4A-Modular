import { useCallback, useEffect, useState } from "react";
import { normalizePaginated } from "@/services/api";
import { PARTICIPANTS_PAGE_SIZE } from "../constants";
import { listarParticipantes } from "@/services/folha.service";
import type { PayrollParticipant } from "@/types";
import { getErrorMessage } from "./errors";

type UsePayrollParticipantsArgs = {
  page: number;
  search: string;
  onError: (message: string) => void;
  onLoadStart: () => void;
};

export function usePayrollParticipants({
  page,
  search,
  onError,
  onLoadStart,
}: UsePayrollParticipantsArgs) {
  const [participants, setParticipants] = useState<PayrollParticipant[]>([]);
  const [meta, setMeta] = useState(() =>
    normalizePaginated<PayrollParticipant>([], PARTICIPANTS_PAGE_SIZE),
  );
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const applyData = useCallback((items: PayrollParticipant[]) => {
    setParticipants(items);
    setSelectedId((current) =>
      items.some((item) => item.id_entidade === current)
        ? current
        : items[0]?.id_entidade || null,
    );
  }, []);

  const reload = useCallback(async () => {
    onLoadStart();

    try {
      const data = normalizePaginated(
        await listarParticipantes({
          termo: search,
          page,
          limit: PARTICIPANTS_PAGE_SIZE,
        }),
        PARTICIPANTS_PAGE_SIZE,
      );

      applyData(data.items);
      setMeta(data);
      return data;
    } catch (error) {
      onError(
        getErrorMessage(error, "Falha ao carregar participantes da folha."),
      );
      return null;
    }
  }, [applyData, onError, onLoadStart, page, search]);

  useEffect(() => {
    let active = true;

    async function load() {
      onLoadStart();

      try {
        const data = normalizePaginated(
          await listarParticipantes({
            termo: search,
            page,
            limit: PARTICIPANTS_PAGE_SIZE,
          }),
          PARTICIPANTS_PAGE_SIZE,
        );

        if (!active) return;
        applyData(data.items);
        setMeta(data);
      } catch (error) {
        if (active) {
          onError(
            getErrorMessage(error, "Falha ao carregar participantes da folha."),
          );
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [applyData, onError, onLoadStart, page, search]);

  return {
    participanteId: selectedId,
    participantes: participants,
    participantesMeta: meta,
    recarregarParticipantes: reload,
    setParticipanteId: setSelectedId,
  };
}
