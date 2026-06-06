import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  depositosApi,
  destinosApi,
  emissoresApi,
  transportadorasApi,
} from '@/services/silo.service'
import type {
  AuthUser,
  CadastroAuxiliar,
  Deposito,
  Destino,
  Emissor,
  PaginatedResponse,
  QueryParams,
  Transportadora,
} from '@/types'
import CrudResourcePage, {
  renderBooleanStatus,
  type CrudColumn,
  type CrudField,
} from '@/screens/_shared/CrudResourcePage'

type CadastrosAuxiliaresPageProps = {
  usuario: AuthUser
}

type AuxForm = {
  nome: string
  documento: string
  telefone: string
  descricao: string
  ativo: boolean
}

type ResourceKey = 'transportadoras' | 'emissores' | 'depositos' | 'destinos'

type ResourceConfig = {
  key: ResourceKey
  label: string
  description: string
  idFrom: (item: CadastroAuxiliar) => number
  api: {
    list: (
      params?: QueryParams,
    ) => Promise<PaginatedResponse<CadastroAuxiliar> | CadastroAuxiliar[]>
    create: (payload: Record<string, unknown>) => Promise<CadastroAuxiliar>
    update: (id: number, payload: Record<string, unknown>) => Promise<CadastroAuxiliar>
    remove: (id: number) => Promise<unknown>
  }
  hasDocumento?: boolean
  hasTelefone?: boolean
  statusField: 'ativo' | 'ativa'
}

const emptyForm: AuxForm = {
  nome: '',
  documento: '',
  telefone: '',
  descricao: '',
  ativo: true,
}

const resources: ResourceConfig[] = [
  {
    key: 'transportadoras',
    label: 'Transportadoras',
    description: 'Empresas usadas nos dados operacionais de frete e cargas.',
    api: transportadorasApi,
    idFrom: (item) => (item as Transportadora).id_transportadora,
    hasDocumento: true,
    hasTelefone: true,
    statusField: 'ativa',
  },
  {
    key: 'emissores',
    label: 'Emissores',
    description: 'Informacao documental da carga, sem definir saldo de produto.',
    api: emissoresApi,
    idFrom: (item) => (item as Emissor).id_emissor,
    hasDocumento: true,
    statusField: 'ativo',
  },
  {
    key: 'depositos',
    label: 'Depositos',
    description: 'Silos, depositos e locais fisicos que mantem saldo.',
    api: depositosApi,
    idFrom: (item) => (item as Deposito).id_deposito,
    statusField: 'ativo',
  },
  {
    key: 'destinos',
    label: 'Destinos',
    description: 'Destinos operacionais de cargas e embarques.',
    api: destinosApi,
    idFrom: (item) => (item as Destino).id_destino,
    statusField: 'ativo',
  },
]

function fieldsFor(config: ResourceConfig): Array<CrudField<AuxForm>> {
  return [
    { name: 'nome', label: 'Nome', required: true },
    ...(config.hasDocumento
      ? [{ name: 'documento' as const, label: 'Documento' }]
      : []),
    ...(config.hasTelefone
      ? [{ name: 'telefone' as const, label: 'Telefone' }]
      : []),
    { name: 'descricao', label: 'Descricao', type: 'textarea' },
    { name: 'ativo', label: 'Cadastro ativo', type: 'checkbox' },
  ]
}

function columnsFor(config: ResourceConfig): Array<CrudColumn<CadastroAuxiliar>> {
  return [
    { header: 'Nome', render: (item) => item.nome || '-' },
    ...(config.hasDocumento
      ? [{ header: 'Documento', render: (item: CadastroAuxiliar) => item.documento || '-' }]
      : []),
    {
      header: 'Descricao',
      render: (item) => item.descricao || '-',
      className: 'hidden md:table-cell',
    },
    {
      header: 'Status',
      render: (item) =>
        renderBooleanStatus(config.statusField === 'ativa' ? item.ativa : item.ativo),
    },
  ]
}

function normalizeForm(item?: CadastroAuxiliar | null): AuxForm {
  return {
    nome: item?.nome || '',
    documento: item?.documento || '',
    telefone: item?.telefone || '',
    descricao: item?.descricao || '',
    ativo: item?.ativo !== false && item?.ativa !== false,
  }
}

function buildPayload(config: ResourceConfig, form: AuxForm) {
  const statusField = config.statusField
  return {
    nome: form.nome.trim(),
    documento: config.hasDocumento ? form.documento.trim() || null : undefined,
    telefone: config.hasTelefone ? form.telefone.trim() || null : undefined,
    descricao: form.descricao.trim() || null,
    [statusField]: form.ativo,
  }
}

function CadastrosAuxiliaresPage({ usuario }: CadastrosAuxiliaresPageProps) {
  const [activeKey, setActiveKey] = useState<ResourceKey>('transportadoras')
  const config = resources.find((item) => item.key === activeKey) || resources[0]

  return (
    <div>
      <div className="px-4 pt-6 sm:px-6">
        <div className="mb-4 flex flex-wrap gap-2">
          {resources.map((resource) => (
            <Button
              key={resource.key}
              onClick={() => setActiveKey(resource.key)}
              type="button"
              variant={resource.key === activeKey ? 'default' : 'outline'}
            >
              {resource.label}
            </Button>
          ))}
        </div>
      </div>
      <CrudResourcePage
        api={config.api}
        buildPayload={(form) => buildPayload(config, form)}
        columns={columnsFor(config)}
        description={config.description}
        emptyForm={emptyForm}
        fields={fieldsFor(config)}
        idFrom={config.idFrom}
        normalizeForm={normalizeForm}
        rowTitle={(item) => item.nome || config.label}
        title={config.label}
        usuario={usuario}
      />
    </div>
  )
}

export default CadastrosAuxiliaresPage
