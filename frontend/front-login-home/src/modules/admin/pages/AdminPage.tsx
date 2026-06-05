import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ShieldCheck, UserCheck, UsersRound } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import StatusMessage from "@/shared/components/feedback/StatusMessage";
import {
  ADMIN_MODULES,
  buildDefaultPermissions,
} from "@/modules/home/constants/modules.constants";
import AccessRequestsPanel from "../components/AccessRequestsPanel";
import MembersPanel from "../components/MembersPanel";
import PermissionsPanel from "../components/PermissionsPanel";
import {
  approveAccessRequest,
  listAccessRequests,
  listAccounts,
  rejectAccessRequest,
  savePermissions,
  updateAccountStatus,
} from "../services/admin.service";
import {
  filterModulesForActor,
  getActiveModules,
  getRequestedModules,
  isProtectedAccount,
  normalizePage,
} from "../utils";

function AdminSummaryCard({ description, icon: Icon, label, value }) {
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

function AdminPage({ onBack, usuario }) {
  const [accounts, setAccounts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [selectedModules, setSelectedModules] = useState([]);
  const [rejectReasons, setRejectReasons] = useState({});
  const [accountPage, setAccountPage] = useState(1);
  const [requestPage, setRequestPage] = useState(1);
  const [accountsMeta, setAccountsMeta] = useState(() => normalizePage([]));
  const [requestsMeta, setRequestsMeta] = useState(() => normalizePage([]));
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const manageableModules = useMemo(
    () => filterModulesForActor(ADMIN_MODULES, usuario),
    [usuario],
  );

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id_conta === selectedAccountId),
    [accounts, selectedAccountId],
  );

  const gerenteSemAdmin = usuario?.possuiGerente && !usuario?.possuiAdmin;
  const selectedAccountLocked = Boolean(
    gerenteSemAdmin && isProtectedAccount(selectedAccount),
  );
  const profileLabel = usuario?.possuiAdmin
    ? "ADMIN"
    : usuario?.possuiGerente
      ? "GERENTE"
      : "USUÁRIO";

  const loadAdminData = useCallback(
    async (preferredAccountId = null, overrides = {}) => {
      const nextAccountPage = overrides.accountPage || accountPage;
      const nextRequestPage = overrides.requestPage || requestPage;

      setLoading(true);
      setStatus(null);

      try {
        const [accountsPayload, requestsPayload] = await Promise.all([
          listAccounts({ page: nextAccountPage, limit: 10 }),
          listAccessRequests({
            page: nextRequestPage,
            limit: 10,
            status: "PENDENTE",
          }),
        ]);

        const loadedAccounts = normalizePage(accountsPayload);
        const loadedRequests = normalizePage(requestsPayload);
        const manageableAccounts = gerenteSemAdmin
          ? loadedAccounts.items.filter(
              (account) => !isProtectedAccount(account),
            )
          : loadedAccounts.items;

        const nextSelectedId = manageableAccounts.some(
          (account) => account.id_conta === preferredAccountId,
        )
          ? preferredAccountId
          : manageableAccounts[0]?.id_conta || null;
        const nextSelectedAccount = manageableAccounts.find(
          (account) => account.id_conta === nextSelectedId,
        );

        setAccountPage(loadedAccounts.page);
        setRequestPage(loadedRequests.page);
        setAccountsMeta(loadedAccounts);
        setRequestsMeta(loadedRequests);
        setAccounts(manageableAccounts);
        setRequests(loadedRequests.items);
        setSelectedAccountId(nextSelectedId);
        setSelectedModules(getActiveModules(nextSelectedAccount?.modulos));
      } catch (error) {
        setStatus({ type: "error", message: error.message });
      } finally {
        setLoading(false);
      }
    },
    [accountPage, gerenteSemAdmin, requestPage],
  );

  useEffect(() => {
    let mounted = true;

    Promise.resolve().then(() => {
      if (mounted) {
        loadAdminData();
      }
    });

    return () => {
      mounted = false;
    };
  }, [loadAdminData]);

  function changeAccountPage(nextPage) {
    setAccountPage(nextPage);
    loadAdminData(selectedAccountId, { accountPage: nextPage });
  }

  function changeRequestPage(nextPage) {
    setRequestPage(nextPage);
    loadAdminData(selectedAccountId, { requestPage: nextPage });
  }

  function selectAccount(account) {
    setSelectedAccountId(account.id_conta);
    setSelectedModules(getActiveModules(account.modulos));
  }

  function toggleSelectedModule(moduleId) {
    if (
      selectedAccountLocked ||
      (gerenteSemAdmin && ["ADMIN", "GERENTE"].includes(moduleId))
    ) {
      return;
    }

    setSelectedModules((current) =>
      current.includes(moduleId)
        ? current.filter((item) => item !== moduleId)
        : [...current, moduleId],
    );
  }

  async function handleStatusChange(account) {
    if (gerenteSemAdmin && isProtectedAccount(account)) {
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      await updateAccountStatus(account.id_conta, !account.ativo);
      setStatus({
        type: "success",
        message: account.ativo ? "Conta desativada." : "Conta ativada.",
      });
      await loadAdminData(selectedAccountId);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePermissions() {
    if (!selectedAccount || selectedAccountLocked) {
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      await savePermissions(
        selectedAccount.id_conta,
        buildDefaultPermissions(
          filterModulesForActor(selectedModules, usuario),
        ),
      );
      setStatus({ type: "success", message: "Permissões salvas." });
      await loadAdminData(selectedAccountId);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleApproveRequest(request) {
    setSaving(true);
    setStatus(null);

    try {
      const requestedModules = filterModulesForActor(
        getRequestedModules(request.modulos_solicitados),
        usuario,
      );

      if (!requestedModules.length) {
        setStatus({
          type: "error",
          message: "Nenhum módulo permitido para aprovar este pedido.",
        });
        return;
      }

      await approveAccessRequest(
        request.id_solicitacao_conta,
        buildDefaultPermissions(requestedModules),
      );
      setStatus({ type: "success", message: "Pedido aprovado." });
      await loadAdminData(selectedAccountId);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleRejectRequest(request) {
    const reason =
      rejectReasons[request.id_solicitacao_conta] ||
      "Solicitação recusada pelo administrador.";

    setSaving(true);
    setStatus(null);

    try {
      await rejectAccessRequest(request.id_solicitacao_conta, reason);
      setStatus({ type: "success", message: "Pedido recusado." });
      await loadAdminData(selectedAccountId);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  }

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
          onReasonChange={(requestId, value) =>
            setRejectReasons((current) => ({ ...current, [requestId]: value }))
          }
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
