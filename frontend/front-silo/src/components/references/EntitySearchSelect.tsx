import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { normalizePaginated } from '@/services/api'
import {
  buscarEntidadeReferencia,
  listarEntidadesReferencia,
} from '@/services/escritorio-referencias.service'
import type { EntidadeReferencia } from '@/types'
import { getEntidadeDocumento, getEntidadeLabel } from './reference-formatters'

type EntitySearchSelectProps = {
  label?: string
  selectedId?: number | null
  selectedEntity?: EntidadeReferencia | null
  onSelect: (entidade: EntidadeReferencia) => void
  onClear: () => void
  disabled?: boolean
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Não foi possível buscar entidades.'
}

function EntitySearchSelect({
  label = 'Entidade associada',
  selectedId,
  selectedEntity,
  onSelect,
  onClear,
  disabled,
}: EntitySearchSelectProps) {
  const [term, setTerm] = useState('')
  const [options, setOptions] = useState<EntidadeReferencia[]>([])
  const [resolvedEntity, setResolvedEntity] = useState<EntidadeReferencia | null>(
    selectedEntity || null,
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const currentEntity = selectedEntity || resolvedEntity
  const currentLabel = useMemo(() => {
    if (currentEntity) return getEntidadeLabel(currentEntity)
    return selectedId ? `Entidade associada (ID ${selectedId})` : 'Conta avulsa / sem Entidade'
  }, [currentEntity, selectedId])

  useEffect(() => {
    setResolvedEntity(selectedEntity || null)
  }, [selectedEntity])

  useEffect(() => {
    let active = true
    if (!selectedId || selectedEntity) return

    async function resolveSelected() {
      try {
        const entidade = await buscarEntidadeReferencia(Number(selectedId))
        if (active) setResolvedEntity(entidade)
      } catch {
        if (active) setResolvedEntity(null)
      }
    }

    void resolveSelected()
    return () => {
      active = false
    }
  }, [selectedEntity, selectedId])

  async function search() {
    setLoading(true)
    setError('')

    try {
      const response = await listarEntidadesReferencia({
        termo: term || undefined,
        page: 1,
        limit: 10,
      })
      setOptions(normalizePaginated(response, 10).items)
    } catch (requestError) {
      setError(toErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  function selectOption(entidade: EntidadeReferencia) {
    setResolvedEntity(entidade)
    setTerm(entidade.nome || '')
    setOptions([])
    onSelect(entidade)
  }

  function clearSelection() {
    setResolvedEntity(null)
    setTerm('')
    setOptions([])
    setError('')
    onClear()
  }

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3">
        <div>
          <Label>{label}</Label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Input
              disabled={disabled}
              onChange={(event) => setTerm(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void search()
                }
              }}
              placeholder="Buscar por nome ou CPF/CNPJ"
              value={term}
            />
            <Button
              disabled={disabled || loading}
              onClick={() => void search()}
              type="button"
              variant="outline"
            >
              Buscar
            </Button>
            <Button
              disabled={disabled || !selectedId}
              onClick={clearSelection}
              type="button"
              variant="ghost"
            >
              Sem vínculo
            </Button>
          </div>
        </div>

        <div className="rounded-md border border-emerald-100 bg-white px-3 py-2 text-sm">
          <span className="font-bold text-slate-700">Atual: </span>
          <span className="text-slate-700">{currentLabel}</span>
        </div>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : null}

        {options.length ? (
          <div className="grid gap-2">
            {options.map((entidade) => (
              <button
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm transition hover:border-emerald-300 hover:bg-emerald-50"
                key={entidade.id_entidade}
                onClick={() => selectOption(entidade)}
                type="button"
              >
                <span className="block font-bold text-slate-800">
                  {entidade.nome || 'Sem nome'}
                </span>
                <span className="text-slate-500">
                  {getEntidadeDocumento(entidade) || 'Sem documento'}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default EntitySearchSelect
