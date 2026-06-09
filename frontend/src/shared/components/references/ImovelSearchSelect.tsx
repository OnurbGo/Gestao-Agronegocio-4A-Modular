import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { normalizePaginated } from '@/shared/services/api'
import {
  buscarImovelReferencia,
  listarImoveisReferencia,
} from '@/shared/services/escritorio-referencias.service'
import type { ImovelReferencia } from '@/shared/types'
import { getImovelLabel } from './reference-formatters'

type ImovelSearchSelectProps = {
  selectedId?: number | null
  selectedImovel?: ImovelReferencia | null
  onSelect: (imovel: ImovelReferencia) => void
  onClear: () => void
  disabled?: boolean
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Não foi possível buscar imóveis.'
}

function ImovelSearchSelect({
  selectedId,
  selectedImovel,
  onSelect,
  onClear,
  disabled,
}: ImovelSearchSelectProps) {
  const [term, setTerm] = useState('')
  const [options, setOptions] = useState<ImovelReferencia[]>([])
  const [resolvedImovel, setResolvedImovel] = useState<ImovelReferencia | null>(
    selectedImovel || null,
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const currentImovel = selectedImovel || resolvedImovel
  const currentLabel = useMemo(() => {
    if (currentImovel) return getImovelLabel(currentImovel)
    return selectedId ? `Imóvel ref. ${selectedId}` : 'Sem imóvel associado'
  }, [currentImovel, selectedId])

  useEffect(() => {
    setResolvedImovel(selectedImovel || null)
  }, [selectedImovel])

  useEffect(() => {
    let active = true
    if (!selectedId || selectedImovel) return

    async function resolveSelected() {
      try {
        const imovel = await buscarImovelReferencia(Number(selectedId))
        if (active) setResolvedImovel(imovel)
      } catch {
        if (active) setResolvedImovel(null)
      }
    }

    void resolveSelected()
    return () => {
      active = false
    }
  }, [selectedId, selectedImovel])

  async function search() {
    setLoading(true)
    setError('')

    try {
      const response = await listarImoveisReferencia({
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

  function selectOption(imovel: ImovelReferencia) {
    setResolvedImovel(imovel)
    setTerm(imovel.nome || '')
    setOptions([])
    onSelect(imovel)
  }

  function clearSelection() {
    setResolvedImovel(null)
    setTerm('')
    setOptions([])
    setError('')
    onClear()
  }

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <Label>Imóvel do Escritório</Label>
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
          placeholder="Buscar por nome, lote ou município"
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
          Sem imóvel
        </Button>
      </div>

      <div className="mt-3 rounded-md border border-emerald-100 bg-white px-3 py-2 text-sm">
        <span className="font-bold text-slate-700">Atual: </span>
        <span className="text-slate-700">{currentLabel}</span>
      </div>

      {error ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}

      {options.length ? (
        <div className="mt-3 grid gap-2">
          {options.map((imovel) => (
            <button
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm transition hover:border-emerald-300 hover:bg-emerald-50"
              key={imovel.id_imovel}
              onClick={() => selectOption(imovel)}
              type="button"
            >
              <span className="block font-bold text-slate-800">
                {imovel.nome || 'Imóvel sem nome'}
              </span>
              <span className="text-slate-500">{getImovelLabel(imovel)}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default ImovelSearchSelect
