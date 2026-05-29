import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ShieldCheck, UserCheck, UserX } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import StatusMessage from '../../shared/components/StatusMessage'
import {
  ADMIN_MODULES,
  buildDefaultPermissions,
  getModuleLabel,
} from '../home/modules.constants'
import {
  approveAccessRequest,
  listAccessRequests,
  listAccounts,
  rejectAccessRequest,
  savePermissions,
  updateAccountStatus,
} from './admin.service'

function formatRequestedModules(value) {
  if (!value) {
    return ['ESCRITORIO']
  }

  if (Array.isArray(value)) {
    return value.length ? value : ['ESCRITORIO']
  }

  if (typeof value === 'object') {
    const modules = Object.values(value).filter(Boolean)
    return modules.length ? modules : ['ESCRITORIO']
  }

  return ['ESCRITORIO']
}

function getRequestedModules(value) {
  return formatRequestedModules(value)
}

function moduleHasPermission(permissao) {
  return Boolean(
    permissao?.pode_visualizar ||
      permissao?.pode_criar ||
      permissao?.pode_editar ||
      permissao?.pode_excluir ||
      permissao?.pode_restaurar,
  )
}

function getActiveModules(modulos = []) {
  return modulos.filter(moduleHasPermission).map((permissao) => permissao.modulo)
}

function hasActiveModule(modulos = [], moduleId) {
  return getActiveModules(modulos).includes(moduleId)
}

function filterModulesForActor(modulos, usuario) {
  if (usuario?.possuiGerente && !usuario?.possuiAdmin) {
    return modulos.filter((moduleId) => !['ADMIN', 'GERENTE'].includes(moduleId))
  }

  return modulos
}

function isProtectedAccount(account) {
  return (
    hasActiveModule(account?.modulos, 'ADMIN') ||
    hasActiveModule(account?.modulos, 'GERENTE')
  )
}

function normalizePage(payload, fallbackLimit = 10) {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      total: payload.length,
      page: 1,
      limit: fallbackLimit,
      totalPages: 1,
    }
  }

  return {
    items: payload?.items || [],
    total: payload?.total || 0,
    page: payload?.page || 1,
    limit: payload?.limit || fallbackLimit,
    totalPages: payload?.totalPages || 1,
  }
}

function PaginationControls({ meta, loading, onPageChange }) {
  return (
    <div className="pagination-row">
      <Button
        disabled={loading || meta.page <= 1}
        onClick={() => onPageChange(meta.page - 1)}
        type="button"
        variant="secondary"
      >
        Anterior
      </Button>
      <span>
        Pagina {meta.page} de {meta.totalPages}
      </span>
      <Button
        disabled={loading || meta.page >= meta.totalPages}
        onClick={() => onPageChange(meta.page + 1)}
        type="button"
        variant="secondary"
      >
        Proxima
      </Button>
    </div>
  )
}

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
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Pedidos de acesso</CardTitle>
        <Badge>{meta.total}</Badge>
      </CardHeader>
      <CardContent className="grid gap-3">
        {requests.length ? (
          requests.map((request) => {
            const requestedModules = formatRequestedModules(request.modulos_solicitados)

            return (
              <article
                className="grid gap-3 rounded-lg border border-slate-200 p-4"
                key={request.id_solicitacao_conta}
              >
                <div className="min-w-0">
                  <strong className="block truncate text-slate-950">{request.nome}</strong>
                  <span className="block truncate text-sm text-slate-600">{request.email}</span>
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
                    onReasonChange(request.id_solicitacao_conta, event.target.value)
                  }
                  placeholder="Motivo da recusa"
                  type="text"
                  value={rejectReasons[request.id_solicitacao_conta] || ''}
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
                  <Button disabled={saving} onClick={() => onApprove(request)} type="button">
                    <UserCheck aria-hidden="true" />
                    Aprovar
                  </Button>
                </div>
              </article>
            )
          })
        ) : (
          <p className="empty-state">
            {loading ? 'Carregando...' : 'Nenhum pedido pendente.'}
          </p>
        )}
        <PaginationControls
          loading={loading || saving}
          meta={meta}
          onPageChange={onPageChange}
        />
      </CardContent>
    </Card>
  )
}

function MembersPanel({ accounts, loading, meta, onPageChange, selectedAccountId, onSelect }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Membros</CardTitle>
        <Badge>{meta.total}</Badge>
      </CardHeader>
      <CardContent>
        <div className="account-list">
          {loading ? (
            <p className="empty-state">Carregando...</p>
          ) : accounts.length ? (
            accounts.map((account) => (
              <button
                className={`account-row ${
                  account.id_conta === selectedAccountId ? 'active' : ''
                }`}
                key={account.id_conta}
                onClick={() => onSelect(account)}
                type="button"
              >
                <span>
                  <strong>{account.usuario?.nome || account.email}</strong>
                  <small>{account.email}</small>
                </span>
                <em>{account.ativo ? 'Ativo' : 'Inativo'}</em>
              </button>
            ))
          ) : (
            <p className="empty-state">Nenhum membro encontrado.</p>
          )}
        </div>
        <PaginationControls
          loading={loading}
          meta={meta}
          onPageChange={onPageChange}
        />
      </CardContent>
    </Card>
  )
}

function PermissionsPanel({
  modules,
  saving,
  selectedAccount,
  selectedAccountLocked,
  selectedModules,
  onStatusChange,
  onToggleModule,
  onSave,
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>{selectedAccount?.usuario?.nome || 'Permissões'}</CardTitle>
          {selectedAccount ? (
            <p className="mt-2 text-sm text-slate-600">{selectedAccount.email}</p>
          ) : null}
        </div>
        {selectedAccount ? (
          <Button
            disabled={saving || selectedAccountLocked}
            onClick={() => onStatusChange(selectedAccount)}
            type="button"
            variant="secondary"
          >
            {selectedAccount.ativo ? 'Desativar' : 'Ativar'}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="module-permission-grid">
          {modules.map((moduleId) => {
            const checked = selectedModules.includes(moduleId)
            const disabled = !selectedAccount || selectedAccountLocked

            return (
              <label
                className={`module-permission-card ${checked ? 'active' : ''}`}
                key={moduleId}
              >
                <Checkbox
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={() => onToggleModule(moduleId)}
                />
                <span>
                  <strong>{getModuleLabel(moduleId)}</strong>
                  <small>{checked ? 'Acesso completo' : 'Sem acesso'}</small>
                </span>
              </label>
            )
          })}
        </div>

        <div className="flex justify-end">
          <Button
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
  )
}

function AdminPage({ onBack, usuario }) {
  const [accounts, setAccounts] = useState([])
  const [requests, setRequests] = useState([])
  const [selectedAccountId, setSelectedAccountId] = useState(null)
  const [selectedModules, setSelectedModules] = useState([])
  const [rejectReasons, setRejectReasons] = useState({})
  const [accountPage, setAccountPage] = useState(1)
  const [requestPage, setRequestPage] = useState(1)
  const [accountsMeta, setAccountsMeta] = useState(() => normalizePage([]))
  const [requestsMeta, setRequestsMeta] = useState(() => normalizePage([]))
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const manageableModules = useMemo(
    () => filterModulesForActor(ADMIN_MODULES, usuario),
    [usuario],
  )

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id_conta === selectedAccountId),
    [accounts, selectedAccountId],
  )

  const gerenteSemAdmin = usuario?.possuiGerente && !usuario?.possuiAdmin
  const selectedAccountLocked = Boolean(gerenteSemAdmin && isProtectedAccount(selectedAccount))

  const loadAdminData = useCallback(
    async (preferredAccountId = null, overrides = {}) => {
      const nextAccountPage = overrides.accountPage || accountPage
      const nextRequestPage = overrides.requestPage || requestPage

      setLoading(true)
      setStatus(null)

      try {
        const [accountsPayload, requestsPayload] = await Promise.all([
          listAccounts({ page: nextAccountPage, limit: 10 }),
          listAccessRequests({
            page: nextRequestPage,
            limit: 10,
            status: 'PENDENTE',
          }),
        ])

        const loadedAccounts = normalizePage(accountsPayload)
        const loadedRequests = normalizePage(requestsPayload)
        const manageableAccounts = gerenteSemAdmin
          ? loadedAccounts.items.filter((account) => !isProtectedAccount(account))
          : loadedAccounts.items

        const nextSelectedId = manageableAccounts.some(
          (account) => account.id_conta === preferredAccountId,
        )
          ? preferredAccountId
          : manageableAccounts[0]?.id_conta || null
        const nextSelectedAccount = manageableAccounts.find(
          (account) => account.id_conta === nextSelectedId,
        )

        setAccountPage(loadedAccounts.page)
        setRequestPage(loadedRequests.page)
        setAccountsMeta(loadedAccounts)
        setRequestsMeta(loadedRequests)
        setAccounts(manageableAccounts)
        setRequests(loadedRequests.items)
        setSelectedAccountId(nextSelectedId)
        setSelectedModules(getActiveModules(nextSelectedAccount?.modulos))
      } catch (error) {
        setStatus({ type: 'error', message: error.message })
      } finally {
        setLoading(false)
      }
    },
    [accountPage, gerenteSemAdmin, requestPage],
  )

  useEffect(() => {
    let mounted = true

    Promise.resolve().then(() => {
      if (mounted) {
        loadAdminData()
      }
    })

    return () => {
      mounted = false
    }
  }, [loadAdminData])

  function changeAccountPage(nextPage) {
    setAccountPage(nextPage)
    loadAdminData(selectedAccountId, { accountPage: nextPage })
  }

  function changeRequestPage(nextPage) {
    setRequestPage(nextPage)
    loadAdminData(selectedAccountId, { requestPage: nextPage })
  }

  function selectAccount(account) {
    setSelectedAccountId(account.id_conta)
    setSelectedModules(getActiveModules(account.modulos))
  }

  function toggleSelectedModule(moduleId) {
    if (selectedAccountLocked || (gerenteSemAdmin && ['ADMIN', 'GERENTE'].includes(moduleId))) {
      return
    }

    setSelectedModules((current) =>
      current.includes(moduleId)
        ? current.filter((item) => item !== moduleId)
        : [...current, moduleId],
    )
  }

  async function handleStatusChange(account) {
    if (gerenteSemAdmin && isProtectedAccount(account)) {
      return
    }

    setSaving(true)
    setStatus(null)

    try {
      await updateAccountStatus(account.id_conta, !account.ativo)
      setStatus({
        type: 'success',
        message: account.ativo ? 'Conta desativada.' : 'Conta ativada.',
      })
      await loadAdminData(selectedAccountId)
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setSaving(false)
    }
  }

  async function handleSavePermissions() {
    if (!selectedAccount || selectedAccountLocked) {
      return
    }

    setSaving(true)
    setStatus(null)

    try {
      await savePermissions(
        selectedAccount.id_conta,
        buildDefaultPermissions(filterModulesForActor(selectedModules, usuario)),
      )
      setStatus({ type: 'success', message: 'Permissões salvas.' })
      await loadAdminData(selectedAccountId)
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setSaving(false)
    }
  }

  async function handleApproveRequest(request) {
    setSaving(true)
    setStatus(null)

    try {
      const requestedModules = filterModulesForActor(
        getRequestedModules(request.modulos_solicitados),
        usuario,
      )

      if (!requestedModules.length) {
        setStatus({
          type: 'error',
          message: 'Nenhum módulo permitido para aprovar este pedido.',
        })
        return
      }

      await approveAccessRequest(
        request.id_solicitacao_conta,
        buildDefaultPermissions(requestedModules),
      )
      setStatus({ type: 'success', message: 'Pedido aprovado.' })
      await loadAdminData(selectedAccountId)
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setSaving(false)
    }
  }

  async function handleRejectRequest(request) {
    const reason =
      rejectReasons[request.id_solicitacao_conta] ||
      'Solicitação recusada pelo administrador.'

    setSaving(true)
    setStatus(null)

    try {
      await rejectAccessRequest(request.id_solicitacao_conta, reason)
      setStatus({ type: 'success', message: 'Pedido recusado.' })
      await loadAdminData(selectedAccountId)
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="admin-layout">
      <section className="section-heading">
        <Button onClick={onBack} type="button" variant="outline">
          <ArrowLeft aria-hidden="true" />
          Voltar
        </Button>
        <div>
          <span>Gestão de acesso</span>
          <h1>Menu Admin</h1>
        </div>
      </section>

      <StatusMessage status={status} />

      <section className="admin-overview-grid">
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
  )
}

export default AdminPage
