import { useCallback, useEffect, useState } from "react";
import { meses } from "../constants";
import {
  buscarParticipante,
  listarLancamentosMensais,
} from "@/services/folha.service";
import type { PayrollLine, PayrollParticipant } from "@/types";
import { criarLinhaBase, normalizarLinha } from "../helpers";
import { getErrorMessage } from "./errors";

type UsePayrollMonthlyEntriesArgs = {
  participantId: number | null;
  year: number;
  onError: (message: string) => void;
  onLoadStart: () => void;
};

function buildInitialRows() {
  return meses.map((month) => criarLinhaBase(month.valor));
}

export function usePayrollMonthlyEntries({
  participantId,
  year,
  onError,
  onLoadStart,
}: UsePayrollMonthlyEntriesArgs) {
  const [detail, setDetail] = useState<PayrollParticipant | null>(null);
  const [rows, setRows] = useState<PayrollLine[]>(buildInitialRows);
  const [loading, setLoading] = useState(false);
  const [changed, setChanged] = useState(false);

  const reset = useCallback(() => {
    setDetail(null);
    setRows(buildInitialRows());
    setChanged(false);
  }, []);

  const applyData = useCallback(
    (participant: PayrollParticipant, entries: Partial<PayrollLine>[]) => {
      const entriesByMonth = new Map(
        entries.map((entry) => [Number(entry.mes), entry]),
      );

      setDetail(participant);
      setRows(
        meses.map((month) =>
          normalizarLinha(entriesByMonth.get(month.valor), month.valor),
        ),
      );
      setChanged(false);
    },
    [],
  );

  const reload = useCallback(async () => {
    if (!participantId) {
      reset();
      return null;
    }

    setLoading(true);
    onLoadStart();

    try {
      const [participant, entries] = await Promise.all([
        buscarParticipante(participantId),
        listarLancamentosMensais(participantId, year),
      ]);

      applyData(participant, entries);
      return { participant, entries };
    } catch (error) {
      onError(
        getErrorMessage(error, "Falha ao carregar lançamentos da folha."),
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, [applyData, onError, onLoadStart, participantId, reset, year]);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!participantId) {
        if (active) reset();
        return;
      }

      setLoading(true);
      onLoadStart();

      try {
        const [participant, entries] = await Promise.all([
          buscarParticipante(participantId),
          listarLancamentosMensais(participantId, year),
        ]);

        if (!active) return;
        applyData(participant, entries);
      } catch (error) {
        if (active) {
          onError(
            getErrorMessage(error, "Falha ao carregar lançamentos da folha."),
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [applyData, onError, onLoadStart, participantId, reset, year]);

  return {
    alterado: changed,
    carregando: loading,
    detalhe: detail,
    linhas: rows,
    recarregarDetalheELancamentos: reload,
    setAlterado: setChanged,
    setLinhas: setRows,
  };
}
