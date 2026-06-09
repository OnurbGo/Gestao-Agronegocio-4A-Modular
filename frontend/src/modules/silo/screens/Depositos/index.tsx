import { depositosApi } from '@/shared/services/silo.service'
import type { AuthUser, Deposito } from '@/shared/types'
import CrudResourcePage, {
  renderBooleanStatus,
  type CrudColumn,
  type CrudField,
} from '@/modules/silo/screens/_shared/CrudResourcePage'

type DepositosPageProps = {
  usuario: AuthUser
}

type DepositoForm = {
  nome: string
  descricao: string
  ativo: boolean
}

const emptyForm: DepositoForm = {
  nome: '',
  descricao: '',
  ativo: true,
}

const fields: Array<CrudField<DepositoForm>> = [
  { name: 'nome', label: 'Nome', required: true },
  { name: 'descricao', label: 'Descrição', type: 'textarea' },
  { name: 'ativo', label: 'Depósito ativo', type: 'checkbox' },
]

const columns: Array<CrudColumn<Deposito>> = [
  { header: 'Depósito/Silo', render: (item) => item.nome || '-' },
  {
    header: 'Descrição',
    render: (item) => item.descricao || '-',
    className: 'hidden md:table-cell',
  },
  { header: 'Status', render: (item) => renderBooleanStatus(item.ativo) },
]

function normalizeForm(item?: Deposito | null): DepositoForm {
  return {
    nome: item?.nome || '',
    descricao: item?.descricao || '',
    ativo: item?.ativo !== false,
  }
}

function buildPayload(form: DepositoForm) {
  return {
    nome: form.nome.trim(),
    descricao: form.descricao.trim() || null,
    ativo: form.ativo,
  }
}

function DepositosPage({ usuario }: DepositosPageProps) {
  return (
    <CrudResourcePage
      api={depositosApi}
      buildPayload={buildPayload}
      columns={columns}
      description="Local físico de estoque ou silo. O depósito movimenta saldo de produto."
      emptyForm={emptyForm}
      fields={fields}
      idFrom={(item) => item.id_deposito}
      normalizeForm={normalizeForm}
      rowTitle={(item) => item.nome || 'Depósito'}
      title="Depósitos / Silos"
      usuario={usuario}
    />
  )
}

export default DepositosPage
