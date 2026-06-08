import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { EntidadeReferencia } from '@/types'
import EntitySearchSelect from './EntitySearchSelect'

type EntityLinkedFieldsProps = {
  entidadeId?: number | null
  entidade?: EntidadeReferencia | null
  nome: string
  documento: string
  onSelectEntidade: (entidade: EntidadeReferencia) => void
  onClearEntidade: () => void
  onChangeNome: (value: string) => void
  onChangeDocumento: (value: string) => void
  disabled?: boolean
  nomeLabel?: string
}

function EntityLinkedFields({
  entidadeId,
  entidade,
  nome,
  documento,
  onSelectEntidade,
  onClearEntidade,
  onChangeNome,
  onChangeDocumento,
  disabled,
  nomeLabel = 'Nome',
}: EntityLinkedFieldsProps) {
  const linked = Boolean(entidadeId)

  return (
    <div className="grid gap-4">
      <EntitySearchSelect
        disabled={disabled}
        onClear={onClearEntidade}
        onSelect={onSelectEntidade}
        selectedEntity={entidade}
        selectedId={entidadeId}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>
            {nomeLabel} <span className="text-red-600">*</span>
          </Label>
          <Input
            className="mt-2"
            disabled={disabled}
            onChange={(event) => onChangeNome(event.target.value)}
            required
            value={nome}
          />
        </div>
        <div>
          <Label>Documento</Label>
          <Input
            className="mt-2"
            disabled={disabled || linked}
            onChange={(event) => onChangeDocumento(event.target.value)}
            value={documento}
          />
          {linked ? (
            <p className="mt-1 text-xs font-semibold text-emerald-700">
              Documento preenchido pelo Escritório.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default EntityLinkedFields
