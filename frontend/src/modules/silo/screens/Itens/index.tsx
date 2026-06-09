import { itensApi } from '@/shared/services/silo.service'
import type { AuthUser, ItemSilo } from '@/shared/types'
import CrudResourcePage, {
  renderBooleanStatus,
  type CrudColumn,
  type CrudField,
} from '@/modules/silo/screens/_shared/CrudResourcePage'

type ItensPageProps = {
  usuario: AuthUser
}

type ItemForm = {
  nome: string
  unidade_medida: string
  controla_estoque: boolean
  exige_classificacao: boolean
  ativo: boolean
}

const emptyForm: ItemForm = {
  nome: '',
  unidade_medida: 'KG',
  controla_estoque: true,
  exige_classificacao: true,
  ativo: true,
}

const fields: Array<CrudField<ItemForm>> = [
  { name: 'nome', label: 'Nome', required: true },
  { name: 'unidade_medida', label: 'Unidade de medida', required: true },
  { name: 'controla_estoque', label: 'Controla estoque', type: 'checkbox' },
  { name: 'exige_classificacao', label: 'Exige classificação', type: 'checkbox' },
  { name: 'ativo', label: 'Item ativo', type: 'checkbox' },
]

const columns: Array<CrudColumn<ItemSilo>> = [
  { header: 'Item', render: (item) => item.nome || '-' },
  { header: 'Unidade', render: (item) => item.unidade_medida || '-' },
  {
    header: 'Classificação',
    render: (item) => (item.exige_classificacao === false ? 'Não' : 'Sim'),
    className: 'hidden md:table-cell',
  },
  { header: 'Status', render: (item) => renderBooleanStatus(item.ativo) },
]

function normalizeForm(item?: ItemSilo | null): ItemForm {
  return {
    nome: item?.nome || '',
    unidade_medida: item?.unidade_medida || 'KG',
    controla_estoque: item?.controla_estoque !== false,
    exige_classificacao: item?.exige_classificacao !== false,
    ativo: item?.ativo !== false,
  }
}

function buildPayload(form: ItemForm) {
  return {
    nome: form.nome.trim(),
    unidade_medida: form.unidade_medida.trim() || 'KG',
    controla_estoque: form.controla_estoque,
    exige_classificacao: form.exige_classificacao,
    ativo: form.ativo,
  }
}

function ItensPage({ usuario }: ItensPageProps) {
  return (
    <CrudResourcePage
      api={itensApi}
      buildPayload={buildPayload}
      columns={columns}
      description="Produtos movimentados pelo Silo, com controle de estoque e classificação por item."
      emptyForm={emptyForm}
      fields={fields}
      idFrom={(item) => item.id_item}
      normalizeForm={normalizeForm}
      rowTitle={(item) => item.nome || 'Item'}
      title="Itens"
      usuario={usuario}
    />
  )
}

export default ItensPage
