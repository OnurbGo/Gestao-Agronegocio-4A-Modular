import { UserCheck, UserX } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { getModuleLabel } from "@/modules/home/constants/modules.constants";
import type { AccessRequest, PageMeta } from "../types";
import { formatRequestedModules } from "../utils";
import PaginationControls from "./PaginationControls";

type AccessRequestsPanelProps = {
  loading: boolean;
  meta: PageMeta<AccessRequest>;
  onPageChange: (page: number) => void;
  requests: AccessRequest[];
  rejectReasons: Record<number, string>;
  saving: boolean;
  onApprove: (request: AccessRequest) => void;
  onReject: (request: AccessRequest) => void;
  onReasonChange: (requestId: number, value: string) => void;
};

function AccessRequestsPanel({
  loading,
  meta,
  onPageChange,
  requests,
  rejectReasons,
  saving,
  onApprove,
  onReject,
  onReasonChange,
}: AccessRequestsPanelProps) {
  return (
    <Card className="min-w-0 border-emerald-100">
      <CardHeader className="flex-row items-start justify-between gap-3 border-b border-emerald-50">
        <div className="min-w-0">
          <CardTitle>Pedidos de acesso</CardTitle>
          <p className="mt-1 text-sm text-slate-600">
            Solicitações aguardando aprovação.
          </p>
        </div>
        <Badge className="shrink-0">{meta.total}</Badge>
      </CardHeader>
      <CardContent className="grid gap-3">
        {requests.length ? (
          requests.map((request) => {
            const requestedModules = formatRequestedModules(
              request.modulos_solicitados,
            );

            return (
              <article
                className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                key={request.id_solicitacao_conta}
              >
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                  <div className="min-w-0">
                    <strong className="block truncate text-slate-950">
                      {request.nome}
                    </strong>
                    <span className="block truncate text-sm text-slate-600">
                      {request.email}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    {requestedModules.map((moduleId) => (
                      <Badge key={moduleId} variant="secondary">
                        {getModuleLabel(moduleId)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Input
                  disabled={saving}
                  onChange={(event) =>
                    onReasonChange(
                      request.id_solicitacao_conta,
                      event.target.value,
                    )
                  }
                  placeholder="Motivo da recusa"
                  type="text"
                  value={rejectReasons[request.id_solicitacao_conta] || ""}
                />
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    disabled={saving}
                    onClick={() => onReject(request)}
                    type="button"
                    variant="secondary"
                  >
                    <UserX aria-hidden="true" />
                    Recusar
                  </Button>
                  <Button
                    disabled={saving}
                    onClick={() => onApprove(request)}
                    type="button"
                  >
                    <UserCheck aria-hidden="true" />
                    Aprovar
                  </Button>
                </div>
              </article>
            );
          })
        ) : (
          <p className="rounded-md border border-dashed border-emerald-100 bg-emerald-50/40 p-4 text-sm font-medium text-slate-600">
            {loading ? "Carregando..." : "Nenhum pedido pendente."}
          </p>
        )}
        <PaginationControls
          loading={loading || saving}
          meta={meta}
          onPageChange={onPageChange}
        />
      </CardContent>
    </Card>
  );
}

export default AccessRequestsPanel;
