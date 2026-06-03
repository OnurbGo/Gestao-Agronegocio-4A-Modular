import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { AdminAccount, PageMeta } from "../types";
import PaginationControls from "./PaginationControls";

type MembersPanelProps = {
  accounts: AdminAccount[];
  loading: boolean;
  meta: PageMeta<AdminAccount>;
  onPageChange: (page: number) => void;
  selectedAccountId: number | null;
  onSelect: (account: AdminAccount) => void;
};

function MembersPanel({
  accounts,
  loading,
  meta,
  onPageChange,
  selectedAccountId,
  onSelect,
}: MembersPanelProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Membros</CardTitle>
        <Badge>{meta.total}</Badge>
      </CardHeader>
      <CardContent>
        <div className="grid max-h-[420px] gap-2 overflow-auto">
          {loading ? (
            <p className="rounded-md border border-dashed border-slate-200 p-4 text-sm font-medium text-slate-500">
              Carregando...
            </p>
          ) : accounts.length ? (
            accounts.map((account) => (
              <button
                className={`flex min-h-16 w-full items-center justify-between gap-3 rounded-lg border bg-white px-4 py-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50/40 ${
                  account.id_conta === selectedAccountId
                    ? "border-emerald-600 bg-emerald-50"
                    : "border-slate-200"
                }`}
                key={account.id_conta}
                onClick={() => onSelect(account)}
                type="button"
              >
                <span className="grid min-w-0 gap-1">
                  <strong className="truncate text-sm text-slate-950">
                    {account.usuario?.nome || account.email}
                  </strong>
                  <small className="truncate text-xs text-slate-500">
                    {account.email}
                  </small>
                </span>
                <em className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold not-italic text-emerald-800">
                  {account.ativo ? "Ativo" : "Inativo"}
                </em>
              </button>
            ))
          ) : (
            <p className="rounded-md border border-dashed border-slate-200 p-4 text-sm font-medium text-slate-500">
              Nenhum membro encontrado.
            </p>
          )}
        </div>
        <PaginationControls
          loading={loading}
          meta={meta}
          onPageChange={onPageChange}
        />
      </CardContent>
    </Card>
  );
}

export default MembersPanel;

