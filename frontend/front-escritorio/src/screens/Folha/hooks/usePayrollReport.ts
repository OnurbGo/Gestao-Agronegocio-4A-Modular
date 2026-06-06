import { useCallback, useEffect, useState } from "react";
import { buscarRelatorioMensal } from "@/services/folha.service";
import type { PayrollMonthlyReport } from "@/types";

type UsePayrollReportArgs = {
  month: number;
  year: number;
};

export function usePayrollReport({ month, year }: UsePayrollReportArgs) {
  const [report, setReport] = useState<PayrollMonthlyReport | null>(null);

  const reload = useCallback(async () => {
    try {
      const data = await buscarRelatorioMensal({ ano: year, mes: month });
      setReport(data);
      return data;
    } catch {
      setReport(null);
      return null;
    }
  }, [month, year]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await buscarRelatorioMensal({ ano: year, mes: month });
        if (active) setReport(data);
      } catch {
        if (active) setReport(null);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [month, year]);

  return { relatorio: report, recarregarRelatorio: reload };
}
