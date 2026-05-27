import { useCallback, useEffect, useMemo, useState } from "react";
import StatusMessage from "../../shared/components/StatusMessage";
import {
  ADMIN_MODULES,
  PERMISSION_ACTIONS,
  buildDefaultPermissions,
} from "../home/modules.constants";
import {
  approveAccessRequest,
  createAccount,
  listAccessRequests,
  listAccounts,
  rejectAccessRequest,
  savePermissions,
  updateAccountStatus,
} from "./admin.service";

const EMPTY_ACCOUNT = {
  nome: "",
  email: "",
  senha: "",
  modulos: ["ESCRITORIO"],
};

function normalizePermissions(modulos = []) {
  const byModule = new Map(
    modulos.map((permissao) => [permissao.modulo, permissao]),
  );

  return ADMIN_MODULES.map((modulo) => ({
    modulo,
    pode_visualizar: false,
    pode_criar: false,
    pode_editar: false,
    pode_excluir: false,
    pode_restaurar: false,
    ...byModule.get(modulo),
  }));
}

function serializePermissions(modulos) {
  return modulos.map((permissao) => ({
    modulo: permissao.modulo,
    pode_visualizar: Boolean(permissao.pode_visualizar),
    pode_criar: Boolean(permissao.pode_criar),
    pode_editar: Boolean(permissao.pode_editar),
    pode_excluir: Boolean(permissao.pode_excluir),
    pode_restaurar: Boolean(permissao.pode_restaurar),
  }));
}

function formatRequestedModules(value) {
  if (!value) {
    return "ESCRITORIO";
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return Object.values(value).join(", ");
}

function getRequestedModules(value) {
  if (Array.isArray(value) && value.length) {
    return value;
  }

  if (value && typeof value === "object") {
    const modules = Object.values(value).filter(Boolean);
    return modules.length ? modules : ["ESCRITORIO"];
  }

  return ["ESCRITORIO"];
}

function hasActiveModule(modulos = [], moduleId) {
  return modulos.some(
    (permissao) => permissao.modulo === moduleId && permissao.pode_visualizar,
  );
}

function filterModulesForActor(modulos, usuario) {
  if (usuario?.possuiGerente && !usuario?.possuiAdmin) {
    return modulos.filter((moduleId) => moduleId !== "ADMIN");
  }

  return modulos;
}

function AdminPage({ onBack, usuario }) {
  const [accounts, setAccounts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [newAccount, setNewAccount] = useState(EMPTY_ACCOUNT);
  const [rejectReasons, setRejectReasons] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id_conta === selectedAccountId),
    [accounts, selectedAccountId],
  );
  const gerenteSemAdmin = usuario?.possuiGerente && !usuario?.possuiAdmin;
  const selectedAccountIsAdmin = hasActiveModule(
    selectedAccount?.modulos,
    "ADMIN",
  );
  const selectedAccountLocked = Boolean(
    gerenteSemAdmin && selectedAccountIsAdmin,
  );

  const loadAdminData = useCallback(async (preferredAccountId = null) => {
    setLoading(true);
    setStatus(null);

    try {
      const [loadedAccounts, loadedRequests] = await Promise.all([
        listAccounts(),
        listAccessRequests(),
      ]);

      const nextSelectedId = loadedAccounts.some(
        (account) => account.id_conta === preferredAccountId,
      )
        ? preferredAccountId
        : loadedAccounts[0]?.id_conta || null;
      const nextSelectedAccount = loadedAccounts.find(
        (account) => account.id_conta === nextSelectedId,
      );

      setAccounts(loadedAccounts);
      setRequests(loadedRequests);
      setSelectedAccountId(nextSelectedId);
      setPermissions(normalizePermissions(nextSelectedAccount?.modulos));
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }, []);

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

  function updateNewAccount(field, value) {
    setNewAccount((current) => ({ ...current, [field]: value }));
  }

  function toggleNewAccountModule(moduleId) {
    if (gerenteSemAdmin && moduleId === "ADMIN") {
      return;
    }

    setNewAccount((current) => {
      const exists = current.modulos.includes(moduleId);
      const modulos = exists
        ? current.modulos.filter((module) => module !== moduleId)
        : [...current.modulos, moduleId];

      return { ...current, modulos: modulos.length ? modulos : ["ESCRITORIO"] };
    });
  }

  function togglePermission(moduleId, actionKey) {
    if (selectedAccountLocked || (gerenteSemAdmin && moduleId === "ADMIN")) {
      return;
    }

    setPermissions((current) =>
      current.map((permissao) =>
        permissao.modulo === moduleId
          ? { ...permissao, [actionKey]: !permissao[actionKey] }
          : permissao,
      ),
    );
  }

  function selectAccount(account) {
    setSelectedAccountId(account.id_conta);
    setPermissions(normalizePermissions(account.modulos));
  }

  async function handleCreateAccount(event) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      await createAccount({
        nome: newAccount.nome,
        email: newAccount.email,
        senha: newAccount.senha,
        modulos: buildDefaultPermissions(
          filterModulesForActor(newAccount.modulos, usuario),
        ),
      });
      setNewAccount(EMPTY_ACCOUNT);
      setStatus({ type: "success", message: "Conta criada." });
      await loadAdminData(selectedAccountId);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(account) {
    if (gerenteSemAdmin && hasActiveModule(account.modulos, "ADMIN")) {
      setStatus({
        type: "error",
        message: "GERENTE não pode alterar uma conta ADMIN.",
      });
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
    if (!selectedAccount) {
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      if (selectedAccountLocked) {
        setStatus({
          type: "error",
          message: "GERENTE não pode alterar permissões de uma conta ADMIN.",
        });
        return;
      }

      await savePermissions(
        selectedAccount.id_conta,
        serializePermissions(permissions),
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
    <main className="admin-layout">
      <section className="section-heading">
        <button className="ghost-button" type="button" onClick={onBack}>
          Voltar
        </button>
        <div>
          <span>Gestão de acesso</span>
          <h1>Menu Admin</h1>
        </div>
      </section>

      <StatusMessage status={status} />

      <section className="admin-grid">
        <form className="panel admin-form" onSubmit={handleCreateAccount}>
          <div className="panel-heading">
            <h2>Nova conta</h2>
            <span>{newAccount.modulos.length} módulos</span>
          </div>
          <p className="empty-state">
            Marque um módulo para liberar tudo dele. A personalização por ação
            fica disponível na grade de permissões abaixo.
          </p>
          <label>
            Nome
            <input
              onChange={(event) => updateNewAccount("nome", event.target.value)}
              required
              type="text"
              value={newAccount.nome}
            />
          </label>
          <label>
            E-mail
            <input
              onChange={(event) =>
                updateNewAccount("email", event.target.value)
              }
              required
              type="email"
              value={newAccount.email}
            />
          </label>
          <label>
            Senha
            <input
              minLength={6}
              onChange={(event) =>
                updateNewAccount("senha", event.target.value)
              }
              required
              type="password"
              value={newAccount.senha}
            />
          </label>
          <div className="module-check-grid">
            {ADMIN_MODULES.map((moduleId) => (
              <label className="check-row" key={moduleId}>
                <input
                  checked={newAccount.modulos.includes(moduleId)}
                  disabled={gerenteSemAdmin && moduleId === "ADMIN"}
                  onChange={() => toggleNewAccountModule(moduleId)}
                  type="checkbox"
                />
                {moduleId}
              </label>
            ))}
          </div>
          <button className="primary-button" disabled={saving} type="submit">
            Criar conta
          </button>
        </form>

        <section className="panel">
          <div className="panel-heading">
            <h2>Pedidos de acesso</h2>
            <span>
              {requests.filter((item) => item.status === "PENDENTE").length}
            </span>
          </div>
          <div className="request-list">
            {requests.length ? (
              requests.map((request) => (
                <article
                  className="request-row"
                  key={request.id_solicitacao_conta}
                >
                  <div>
                    <strong>{request.nome}</strong>
                    <span>{request.email}</span>
                    <small>
                      {formatRequestedModules(request.modulos_solicitados)}
                    </small>
                  </div>
                  <input
                    disabled={request.status !== "PENDENTE"}
                    onChange={(event) =>
                      setRejectReasons((current) => ({
                        ...current,
                        [request.id_solicitacao_conta]: event.target.value,
                      }))
                    }
                    placeholder="Motivo da recusa"
                    type="text"
                    value={rejectReasons[request.id_solicitacao_conta] || ""}
                  />
                  <div className="row-actions">
                    <button
                      className="secondary-button"
                      disabled={saving || request.status !== "PENDENTE"}
                      onClick={() => handleRejectRequest(request)}
                      type="button"
                    >
                      Recusar
                    </button>
                    <button
                      className="primary-button"
                      disabled={saving || request.status !== "PENDENTE"}
                      onClick={() => handleApproveRequest(request)}
                      type="button"
                    >
                      Aprovar
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p className="empty-state">Nenhum pedido encontrado.</p>
            )}
          </div>
        </section>
      </section>

      <section className="admin-grid wide">
        <section className="panel account-list-panel">
          <div className="panel-heading">
            <h2>Usuários</h2>
            <span>{accounts.length}</span>
          </div>
          <div className="account-list">
            {loading ? (
              <p className="empty-state">Carregando...</p>
            ) : (
              accounts.map((account) => (
                <button
                  className={`account-row ${
                    account.id_conta === selectedAccountId ? "active" : ""
                  }`}
                  key={account.id_conta}
                  onClick={() => selectAccount(account)}
                  type="button"
                >
                  <span>
                    <strong>{account.usuario?.nome || account.email}</strong>
                    <small>{account.email}</small>
                  </span>
                  <em>{account.ativo ? "Ativo" : "Inativo"}</em>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="panel permissions-panel">
          <div className="panel-heading">
            <h2>{selectedAccount?.usuario?.nome || "Permissões"}</h2>
            {selectedAccount ? (
              <button
                className="secondary-button"
                disabled={saving || selectedAccountLocked}
                onClick={() => handleStatusChange(selectedAccount)}
                type="button"
              >
                {selectedAccount.ativo ? "Desativar" : "Ativar"}
              </button>
            ) : null}
          </div>

          <div className="permissions-table-wrap">
            <table className="permissions-table">
              <thead>
                <tr>
                  <th>Módulo</th>
                  {PERMISSION_ACTIONS.map((action) => (
                    <th key={action.key}>{action.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissions.map((permissao) => (
                  <tr key={permissao.modulo}>
                    <td>{permissao.modulo}</td>
                    {PERMISSION_ACTIONS.map((action) => (
                      <td key={action.key}>
                        <input
                          checked={Boolean(permissao[action.key])}
                          disabled={
                            selectedAccountLocked ||
                            (gerenteSemAdmin && permissao.modulo === "ADMIN")
                          }
                          onChange={() =>
                            togglePermission(permissao.modulo, action.key)
                          }
                          type="checkbox"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel-actions">
            <button
              className="primary-button"
              disabled={saving || !selectedAccount || selectedAccountLocked}
              onClick={handleSavePermissions}
              type="button"
            >
              Salvar permissões
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}

export default AdminPage;
