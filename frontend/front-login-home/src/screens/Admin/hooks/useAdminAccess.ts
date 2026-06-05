import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ADMIN_MODULES,
  buildDefaultPermissions,
} from "@/navigation/modules";
import {
  approveAccessRequest,
  listAccessRequests,
  listAccounts,
  rejectAccessRequest,
  savePermissions,
  updateAccountStatus,
} from "@/services/admin.service";
import type {
  AccessRequest,
  AdminAccount,
  AdminModuleId,
  AuthUser,
  PageMeta,
  StatusMessageState,
} from "@/types";
import {
  filterModulesForActor,
  getActiveModules,
  getRequestedModules,
  isProtectedAccount,
  normalizePage,
} from "../helpers";

type AdminLoadOverrides = Partial<{
  accountPage: number;
  requestPage: number;
}>;

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Nao foi possivel concluir a acao.";
}

export function useAdminAccess(usuario: AuthUser) {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedModules, setSelectedModules] = useState<AdminModuleId[]>([]);
  const [rejectReasons, setRejectReasons] = useState<Record<number, string>>({});
  const [accountPage, setAccountPage] = useState(1);
  const [requestPage, setRequestPage] = useState(1);
  const [accountsMeta, setAccountsMeta] = useState<PageMeta<AdminAccount>>(() =>
    normalizePage<AdminAccount>([]),
  );
  const [requestsMeta, setRequestsMeta] = useState<PageMeta<AccessRequest>>(() =>
    normalizePage<AccessRequest>([]),
  );
  const [status, setStatus] = useState<StatusMessageState>(null);
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
    async (
      preferredAccountId: number | null = null,
      overrides: AdminLoadOverrides = {},
    ) => {
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
        setStatus({ type: "error", message: getErrorMessage(error) });
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

  function changeAccountPage(nextPage: number) {
    setAccountPage(nextPage);
    loadAdminData(selectedAccountId, { accountPage: nextPage });
  }

  function changeRequestPage(nextPage: number) {
    setRequestPage(nextPage);
    loadAdminData(selectedAccountId, { requestPage: nextPage });
  }

  function selectAccount(account: AdminAccount) {
    setSelectedAccountId(account.id_conta);
    setSelectedModules(getActiveModules(account.modulos));
  }

  function changeRejectReason(requestId: number, value: string) {
    setRejectReasons((current) => ({ ...current, [requestId]: value }));
  }

  function toggleSelectedModule(moduleId: AdminModuleId) {
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

  async function handleStatusChange(account: AdminAccount) {
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
      setStatus({ type: "error", message: getErrorMessage(error) });
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
      setStatus({ type: "error", message: getErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  async function handleApproveRequest(request: AccessRequest) {
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
      setStatus({ type: "error", message: getErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  async function handleRejectRequest(request: AccessRequest) {
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
      setStatus({ type: "error", message: getErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  return {
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
  };
}
