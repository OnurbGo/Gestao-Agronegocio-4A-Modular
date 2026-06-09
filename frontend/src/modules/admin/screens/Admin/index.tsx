import {
  ArrowLeft,
  ShieldCheck,
  UserCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import StatusMessage from "@/shared/components/feedback/StatusMessage";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import type { AuthUser } from "@/shared/types";
import AccessRequestsPanel from "./components/AccessRequestsPanel";
import MembersPanel from "./components/MembersPanel";
import PermissionsPanel from "./components/PermissionsPanel";
import { useAdminAccess } from "./hooks/useAdminAccess";

type AdminSummaryCardProps = {
  description: string;
  icon: LucideIcon;
  label: string;
  value: string | number;
};

type AdminPageProps = {
  onBack: () => void;
  usuario: AuthUser;
};

function AdminSummaryCard({
  description,
  icon: Icon,
  label,
  value,
}: AdminSummaryCardProps) {
  return (
    <Card className="min-w-0 border-emerald-100">
      <CardContent className="flex items-center gap-4 p-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-800">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
        <span className="grid min-w-0 gap-1">
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">
            {label}
          </span>
          <strong className="truncate text-xl font-bold text-slate-950">
            {value}
          </strong>
          <small className="truncate text-xs font-semibold text-slate-500">
            {description}
          </small>
        </span>
      </CardContent>
    </Card>
  );
}

function AdminPage({ onBack, usuario }: AdminPageProps) {
  const {
    accounts,
    accountsMeta,
    changeAccountPage,
    changeRejectReason,
    changeRequestPage,
    handleApproveRequest,
    handleRejectRequest,
    handleSavePermissions,
    handleStatusChange,
    loading,
    manageableModules,
    profileLabel,
    rejectReasons,
    requests,
    requestsMeta,
    saving,
    selectAccount,
    selectedAccount,
    selectedAccountId,
    selectedAccountLocked,
    selectedModules,
    status,
    toggleSelectedModule,
  } = useAdminAccess(usuario);

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button
              className="w-full sm:w-auto"
              onClick={onBack}
              type="button"
              variant="outline"
            >
              <ArrowLeft aria-hidden="true" />
              Voltar
            </Button>
            <div className="min-w-0">
              <span className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">
                Gestão de acesso
              </span>
              <h1 className="mt-1 text-3xl font-bold text-slate-950">
                Menu Admin
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Revise solicitações, contas e permissões sem alterar as regras
                de acesso existentes.
              </p>
            </div>
          </div>
          <Badge className="w-fit" variant="secondary">
            Perfil {profileLabel}
          </Badge>
        </div>
      </section>

      <StatusMessage status={status} />

      <section className="grid gap-3 md:grid-cols-3">
        <AdminSummaryCard
          description="permissões aplicadas ao usuário atual"
          icon={ShieldCheck}
          label="Perfil atual"
          value={profileLabel}
        />
        <AdminSummaryCard
          description="solicitações aguardando decisão"
          icon={UserCheck}
          label="Pedidos pendentes"
          value={loading ? "..." : requestsMeta.total}
        />
        <AdminSummaryCard
          description="contas visíveis nesta página"
          icon={UsersRound}
          label="Membros"
          value={loading ? "..." : accounts.length}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)]">
        <AccessRequestsPanel
          loading={loading}
          meta={requestsMeta}
          onApprove={handleApproveRequest}
          onPageChange={changeRequestPage}
          onReasonChange={changeRejectReason}
          onReject={handleRejectRequest}
          rejectReasons={rejectReasons}
          requests={requests}
          saving={saving}
        />

        <MembersPanel
          accounts={accounts}
          loading={loading}
          meta={accountsMeta}
          onPageChange={changeAccountPage}
          onSelect={selectAccount}
          selectedAccountId={selectedAccountId}
        />
      </section>

      <PermissionsPanel
        modules={manageableModules}
        onSave={handleSavePermissions}
        onStatusChange={handleStatusChange}
        onToggleModule={toggleSelectedModule}
        saving={saving}
        selectedAccount={selectedAccount}
        selectedAccountLocked={selectedAccountLocked}
        selectedModules={selectedModules}
      />
    </main>
  );
}

export default AdminPage;
