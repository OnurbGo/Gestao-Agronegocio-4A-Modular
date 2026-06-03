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
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Pedidos de acesso</CardTitle>
        <Badge>{meta.total}</Badge>
      </CardHeader>
      <CardContent className="grid gap-3">
        {requests.length ? (
          requests.map((request) => {
            const requestedModules = formatRequestedModules(
              request.modulos_solicitados,
            );

            return (
              <article
                className="grid gap-3 rounded-lg border border-slate-200 p-4"
                key={request.id_solicitacao_conta}
              >
                <div className="min-w-0">
                  <strong className="block truncate text-slate-950">
                    {request.nome}
                  </strong>
                  <span className="block truncate text-sm text-slate-600">
                    {request.email}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {requestedModules.map((moduleId) => (
                    <Badge key={moduleId} variant="secondary">
                      {getModuleLabel(moduleId)}
                    </Badge>
                  ))}
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
                <div className="flex flex-wrap justify-end gap-2">
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
          <p className="rounded-md border border-dashed border-slate-200 p-4 text-sm font-medium text-slate-500">
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

