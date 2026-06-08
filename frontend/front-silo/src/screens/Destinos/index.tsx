import { destinosApi } from '@/services/silo.service'
import type { AuthUser, Destino } from '@/types'
import CrudResourcePage, {
  renderBooleanStatus,
  type CrudColumn,
  type CrudField,
} from '@/screens/_shared/CrudResourcePage'

type DestinosPageProps = {
  usuario: AuthUser
}

type DestinoForm = {
  nome: string
  descricao: string
  ativo: boolean
}

const emptyForm: DestinoForm = {
  nome: '',
  descricao: '',
  ativo: true,
}

const fields: Array<CrudField<DestinoForm>> = [
  { name: 'nome', label: 'Nome', required: true },
  { name: 'descricao', label: 'Descrição', type: 'textarea' },
  { name: 'ativo', label: 'Destino ativo', type: 'checkbox' },
]

const columns: Array<CrudColumn<Destino>> = [
  { header: 'Destino', render: (item) => item.nome || '-' },
  {
    header: 'Descrição',
    render: (item) => item.descricao || '-',
    className: 'hidden md:table-cell',
  },
  { header: 'Status', render: (item) => renderBooleanStatus(item.ativo) },
]

function normalizeForm(item?: Destino | null): DestinoForm {
  return {
    nome: item?.nome || '',
    descricao: item?.descricao || '',
    ativo: item?.ativo !== false,
  }
}

function buildPayload(form: DestinoForm) {
  return {
    nome: form.nome.trim(),
    descricao: form.descricao.trim() || null,
    ativo: form.ativo,
  }
}

function DestinosPage({ usuario }: DestinosPageProps) {
  return (
    <CrudResourcePage
      api={destinosApi}
      buildPayload={buildPayload}
      columns={columns}
      description="Destino operacional da carga. Não movimenta saldo diretamente; serve para saída, embarque e relatórios."
      emptyForm={emptyForm}
      fields={fields}
      idFrom={(item) => item.id_destino}
      normalizeForm={normalizeForm}
      rowTitle={(item) => item.nome || 'Destino'}
      title="Destinos"
      usuario={usuario}
    />
  )
}

export default DestinosPage
