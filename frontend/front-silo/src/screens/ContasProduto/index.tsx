import { contasProdutoApi } from '@/services/silo.service'
import type { AuthUser, ContaProduto } from '@/types'
import CrudResourcePage, {
  renderBooleanStatus,
  type CrudColumn,
  type CrudField,
} from '@/screens/_shared/CrudResourcePage'

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

const emptyForm: ContaForm = {
  entidade_id_ref: '',
  nome: '',
  documento: '',
  ativa: true,
  observacao: '',
}

const fields: Array<CrudField<ContaForm>> = [
  { name: 'nome', label: 'Nome', required: true },
  { name: 'documento', label: 'Documento' },
  { name: 'entidade_id_ref', label: 'Entidade ref.', type: 'number' },
  { name: 'ativa', label: 'Conta ativa', type: 'checkbox' },
  { name: 'observacao', label: 'Observacao', type: 'textarea' },
]

const columns: Array<CrudColumn<ContaProduto>> = [
  { header: 'Nome', render: (item) => item.nome || '-' },
  { header: 'Documento', render: (item) => item.documento || '-' },
  {
    header: 'Entidade ref.',
    render: (item) => item.entidade_id_ref || '-',
    className: 'hidden md:table-cell',
  },
  { header: 'Status', render: (item) => renderBooleanStatus(item.ativa) },
]

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
    nome: form.nome.trim(),
    documento: form.documento.trim() || null,
    entidade_id_ref: form.entidade_id_ref ? Number(form.entidade_id_ref) : null,
    ativa: form.ativa,
    observacao: form.observacao.trim() || null,
  }
}

function ContasProdutoPage({ usuario }: ContasProdutoPageProps) {
  return (
    <CrudResourcePage
      api={contasProdutoApi}
      buildPayload={buildPayload}
      columns={columns}
      description="Contas que recebem e baixam saldo de produto, com ou sem vinculo formal ao Escritorio."
      emptyForm={emptyForm}
      fields={fields}
      idFrom={(item) => item.id_conta_produto}
      normalizeForm={normalizeForm}
      rowTitle={(item) => item.nome || 'Conta de produto'}
      title="Contas de Produto"
      usuario={usuario}
    />
  )
}

export default ContasProdutoPage
