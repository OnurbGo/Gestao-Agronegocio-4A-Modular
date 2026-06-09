import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import EntityLinkedFields from '@/shared/components/references/EntityLinkedFields'
import { getEntidadeDocumento } from '@/shared/components/references/reference-formatters'
import StatusMessage from '@/shared/components/feedback/StatusMessage'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { Textarea } from '@/shared/components/ui/textarea'
import { canCreate, canEdit } from '@/shared/services/auth.service'
import { normalizePaginated } from '@/shared/services/api'
import { contasProdutoApi } from '@/shared/services/silo.service'
import type {
  AuthUser,
  ContaProduto,
  EntidadeReferencia,
  StatusMessageState,
} from '@/shared/types'
import EmptyState from '@/modules/silo/screens/_shared/EmptyState'
import PageHeader from '@/modules/silo/screens/_shared/PageHeader'
import ScreenSection from '@/modules/silo/screens/_shared/ScreenSection'

type ContasProdutoPageProps = {
  usuario: AuthUser
}

type ContaForm = {
  entidade_id_ref: string
  nome: string
  documento: string
  ativa: boolean
  observacao: string
}

const PAGE_SIZE = 20
const emptyForm: ContaForm = {
  entidade_id_ref: '',
  nome: '',
  documento: '',
  ativa: true,
  observacao: '',
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Não foi possível concluir.'
}

function normalizeForm(item?: ContaProduto | null): ContaForm {
  return {
    entidade_id_ref: item?.entidade_id_ref ? String(item.entidade_id_ref) : '',
    nome: item?.nome || '',
    documento: item?.documento || '',
    ativa: item?.ativa !== false,
    observacao: item?.observacao || '',
  }
}

function buildPayload(form: ContaForm) {
  return {
    entidade_id_ref: form.entidade_id_ref ? Number(form.entidade_id_ref) : null,
    nome: form.nome.trim(),
    documento: form.documento.trim() || null,
    ativa: form.ativa,
    observacao: form.observacao.trim() || null,
  }
}

function ContasProdutoPage({ usuario }: ContasProdutoPageProps) {
  const [contas, setContas] = useState<ContaProduto[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedEntidade, setSelectedEntidade] =
    useState<EntidadeReferencia | null>(null)
  const [form, setForm] = useState<ContaForm>(emptyForm)
  const [termo, setTermo] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<StatusMessageState>(null)

  const selected = useMemo(
    () => contas.find((conta) => conta.id_conta_produto === selectedId),
    [contas, selectedId],
  )
  const mayCreate = canCreate(usuario, 'SILO')
  const mayEdit = canEdit(usuario, 'SILO')
  const canSave = selectedId ? mayEdit : mayCreate

  async function loadContas(nextPage = page) {
    setLoading(true)
    setStatus(null)

    try {
      const response = await contasProdutoApi.list({
        search: termo || undefined,
        termo: termo || undefined,
        nome: termo || undefined,
        ativa: statusFilter === '' ? undefined : statusFilter === 'ativa',
        page: nextPage,
        limit: PAGE_SIZE,
      })
      const normalized = normalizePaginated(response, PAGE_SIZE)
      setContas(normalized.items)
      setPage(normalized.page)
      setTotalPages(normalized.totalPages)
      setTotal(normalized.total)
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadContas(1)
  }, [])

  function selectConta(conta: ContaProduto) {
    setSelectedId(conta.id_conta_produto)
    setSelectedEntidade(null)
    setForm(normalizeForm(conta))
    setStatus(null)
  }

  function newConta() {
    setSelectedId(null)
    setSelectedEntidade(null)
    setForm(emptyForm)
    setStatus(null)
  }

  function selectEntidade(entidade: EntidadeReferencia) {
    setSelectedEntidade(entidade)
    setForm((current) => ({
      ...current,
      entidade_id_ref: String(entidade.id_entidade),
      nome: entidade.nome || current.nome,
      documento: getEntidadeDocumento(entidade) || current.documento,
    }))
  }

  function clearEntidade() {
    setSelectedEntidade(null)
    setForm((current) => ({ ...current, entidade_id_ref: '' }))
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSave) {
      setStatus({ type: 'warning', message: 'Sem permissão para salvar.' })
      return
    }

    setLoading(true)
    setStatus(null)

    try {
      const saved = selectedId
        ? await contasProdutoApi.update(selectedId, buildPayload(form))
        : await contasProdutoApi.create(buildPayload(form))
      setSelectedId(saved.id_conta_produto)
      setForm(normalizeForm(saved))
      setStatus({ type: 'success', message: 'Conta de produto salva.' })
      await loadContas(page)
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  async function removeSelected() {
    if (!selectedId || !mayEdit) return
    const confirmed = window.confirm('Desativar esta conta de produto?')
    if (!confirmed) return

    setLoading(true)
    setStatus(null)

    try {
      await contasProdutoApi.remove(selectedId)
      newConta()
      setStatus({ type: 'success', message: 'Conta removida ou desativada.' })
      await loadContas(1)
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="px-4 py-6 sm:px-6">
      <PageHeader
        actions={
          <Button disabled={!mayCreate} onClick={newConta} type="button">
            Nova conta
          </Button>
        }
        description="Conta que recebe e baixa saldo de produto. Pode ser vinculada a uma Entidade do Escritório ou criada de forma avulsa."
        title="Contas de Produto"
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_460px]">
        <ScreenSection
          actions={
            <>
              <Input
                className="w-full sm:w-64"
                onChange={(event) => setTermo(event.target.value)}
                placeholder="Pesquisar nome ou documento"
                value={termo}
              />
              <select
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm"
                onChange={(event) => setStatusFilter(event.target.value)}
                value={statusFilter}
              >
                <option value="">Todas</option>
                <option value="ativa">Ativas</option>
                <option value="inativa">Inativas</option>
              </select>
              <Button
                disabled={loading}
                onClick={() => void loadContas(1)}
                type="button"
                variant="outline"
              >
                Filtrar
              </Button>
            </>
          }
          title="Registros"
        >
          {contas.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead className="hidden md:table-cell">Vínculo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contas.map((conta) => (
                  <TableRow
                    className={
                      selectedId === conta.id_conta_produto ? 'bg-emerald-50' : undefined
                    }
                    key={conta.id_conta_produto}
                    onClick={() => selectConta(conta)}
                  >
                    <TableCell className="font-semibold">{conta.nome || '-'}</TableCell>
                    <TableCell>{conta.documento || '-'}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {conta.entidade_id_ref ? `Entidade ${conta.entidade_id_ref}` : 'Avulsa'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={conta.ativa === false ? 'secondary' : 'default'}>
                        {conta.ativa === false ? 'Inativa' : 'Ativa'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState title={loading ? 'Carregando contas...' : undefined} />
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
            <span>
              {total} registro(s), página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                disabled={loading || page <= 1}
                onClick={() => void loadContas(page - 1)}
                type="button"
                variant="outline"
              >
                Anterior
              </Button>
              <Button
                disabled={loading || page >= totalPages}
                onClick={() => void loadContas(page + 1)}
                type="button"
                variant="outline"
              >
                Próxima
              </Button>
            </div>
          </div>
        </ScreenSection>

        <ScreenSection title={selected ? selected.nome || 'Editar conta' : 'Nova conta'}>
          <form className="grid gap-4" onSubmit={save}>
            <EntityLinkedFields
              documento={form.documento}
              entidade={selectedEntidade}
              entidadeId={
                form.entidade_id_ref ? Number(form.entidade_id_ref) : null
              }
              nome={form.nome}
              onChangeDocumento={(value) =>
                setForm((current) => ({ ...current, documento: value }))
              }
              onChangeNome={(value) =>
                setForm((current) => ({ ...current, nome: value }))
              }
              onClearEntidade={clearEntidade}
              onSelectEntidade={selectEntidade}
              nomeLabel="Nome da conta"
            />

            <label className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700">
              <input
                checked={form.ativa}
                className="h-4 w-4 accent-emerald-700"
                onChange={(event) =>
                  setForm((current) => ({ ...current, ativa: event.target.checked }))
                }
                type="checkbox"
              />
              Conta ativa
            </label>

            <div>
              <Label>Observação</Label>
              <Textarea
                className="mt-2"
                onChange={(event) =>
                  setForm((current) => ({ ...current, observacao: event.target.value }))
                }
                value={form.observacao}
              />
            </div>

            <StatusMessage status={status} />

            <div className="flex flex-wrap gap-2">
              <Button disabled={loading || !canSave} type="submit">
                Salvar
              </Button>
              <Button onClick={newConta} type="button" variant="outline">
                Limpar
              </Button>
              {selectedId ? (
                <Button
                  disabled={loading || !mayEdit}
                  onClick={() => void removeSelected()}
                  type="button"
                  variant="destructive"
                >
                  Desativar
                </Button>
              ) : null}
            </div>
          </form>
        </ScreenSection>
      </div>
    </section>
  )
}

export default ContasProdutoPage
