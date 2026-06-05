import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { getModuleLabel } from "@/navigation/modules";
import type { AdminAccount, AdminModuleId } from "@/types";

type PermissionsPanelProps = {
  modules: AdminModuleId[];
  saving: boolean;
  selectedAccount?: AdminAccount;
  selectedAccountLocked: boolean;
  selectedModules: AdminModuleId[];
  onStatusChange: (account: AdminAccount) => void;
  onToggleModule: (moduleId: AdminModuleId) => void;
  onSave: () => void;
};

function PermissionsPanel({
  modules,
  saving,
  selectedAccount,
  selectedAccountLocked,
  selectedModules,
  onStatusChange,
  onToggleModule,
  onSave,
}: PermissionsPanelProps) {
  return (
    <Card className="min-w-0 border-emerald-100">
      <CardHeader className="flex-col items-start justify-between gap-4 border-b border-emerald-50 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <CardTitle>
            {selectedAccount?.usuario?.nome || "Permissões"}
          </CardTitle>
          {selectedAccount ? (
            <p className="mt-2 truncate text-sm text-slate-600">
              {selectedAccount.email}
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-600">
              Selecione um membro para revisar permissões.
            </p>
          )}
        </div>
        {selectedAccount ? (
          <Button
            className="w-full sm:w-auto"
            disabled={saving || selectedAccountLocked}
            onClick={() => onStatusChange(selectedAccount)}
            type="button"
            variant="secondary"
          >
            {selectedAccount.ativo ? "Desativar" : "Ativar"}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-5">
        {selectedAccountLocked ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            Esta conta é protegida para o seu perfil atual.
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((moduleId) => {
            const checked = selectedModules.includes(moduleId);
            const disabled = !selectedAccount || selectedAccountLocked;

            return (
              <label
                className={`flex min-h-16 items-center gap-3 rounded-lg border p-3 transition ${
                  checked
                    ? "border-emerald-600 bg-emerald-50"
                    : "border-slate-200 bg-white"
                } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-emerald-300"}`}
                key={moduleId}
              >
                <Checkbox
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={() => onToggleModule(moduleId)}
                />
                <span className="grid min-w-0 gap-1">
                  <strong className="truncate text-sm text-slate-950">
                    {getModuleLabel(moduleId)}
                  </strong>
                  <small className="truncate text-xs text-slate-500">
                    {checked ? "Acesso completo" : "Sem acesso"}
                  </small>
                </span>
              </label>
            );
          })}
        </div>

        <div className="flex justify-end">
          <Button
            className="w-full sm:w-auto"
            disabled={saving || !selectedAccount || selectedAccountLocked}
            onClick={onSave}
            type="button"
          >
            <ShieldCheck aria-hidden="true" />
            Salvar permissões
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default PermissionsPanel;
