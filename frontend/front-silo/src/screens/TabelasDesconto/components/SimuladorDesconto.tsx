import { useState } from 'react'
import type { FormEvent } from 'react'
import StatusMessage from '@/components/feedback/StatusMessage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { tabelasDescontoApi } from '@/services/silo.service'
import type { ItemSilo, StatusMessageState } from '@/types'
import { formatKg, formatPercent, formatSacas } from '@/utils/formatters'

type SimuladorDescontoProps = {
  itens: ItemSilo[]
}

type SimuladorForm = {
  item_id: string
  peso_liquido_kg: string
  umidade_percentual: string
  impureza_percentual: string
}

const emptyForm: SimuladorForm = {
  item_id: '',
  peso_liquido_kg: '',
  umidade_percentual: '',
  impureza_percentual: '',
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Não foi possível simular.'
}

function getResultValue(result: Record<string, unknown> | null, key: string) {
  return result?.[key]
}

function SimuladorDesconto({ itens }: SimuladorDescontoProps) {
  const [form, setForm] = useState<SimuladorForm>(emptyForm)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<StatusMessageState>(null)

  async function simular(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setStatus(null)
    setResult(null)

    try {
      setResult(
        await tabelasDescontoApi.calcular({
          item_id: Number(form.item_id),
          peso_liquido_kg: Number(form.peso_liquido_kg),
          umidade_percentual: Number(form.umidade_percentual),
          impureza_percentual: Number(form.impureza_percentual),
        }),
      )
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <form className="grid gap-3 md:grid-cols-5" onSubmit={simular}>
        <select
          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm md:col-span-2"
          onChange={(event) => setForm((current) => ({ ...current, item_id: event.target.value }))}
          required
          value={form.item_id}
        >
          <option value="">Item</option>
          {itens.map((item) => (
            <option key={item.id_item} value={item.id_item}>
              {item.nome}
            </option>
          ))}
        </select>
        <Input
          onChange={(event) =>
            setForm((current) => ({ ...current, peso_liquido_kg: event.target.value }))
          }
          placeholder="Peso líquido kg"
          required
          type="number"
          value={form.peso_liquido_kg}
        />
        <Input
          onChange={(event) =>
            setForm((current) => ({ ...current, umidade_percentual: event.target.value }))
          }
          placeholder="Umidade %"
          required
          type="number"
          value={form.umidade_percentual}
        />
        <Input
          onChange={(event) =>
            setForm((current) => ({ ...current, impureza_percentual: event.target.value }))
          }
          placeholder="Impureza %"
          required
          type="number"
          value={form.impureza_percentual}
        />
        <Button className="md:col-span-5" disabled={loading} type="submit" variant="outline">
          Simular desconto
        </Button>
      </form>

      <StatusMessage status={status} />

      {result ? (
        <div className="mt-4 grid gap-3 rounded-md border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900 md:grid-cols-3">
          <span>
            Desc. umidade: {formatPercent(getResultValue(result, 'desconto_umidade_percentual'))}
          </span>
          <span>
            Desc. impureza: {formatPercent(getResultValue(result, 'desconto_impureza_percentual'))}
          </span>
          <span>
            Desc. umidade kg: {formatKg(getResultValue(result, 'desconto_umidade_kg'))}
          </span>
          <span>
            Desc. impureza kg: {formatKg(getResultValue(result, 'desconto_impureza_kg'))}
          </span>
          <span>Peso final: {formatKg(getResultValue(result, 'peso_final_kg'))}</span>
          <span>Sacas finais: {formatSacas(getResultValue(result, 'sacas_final'))}</span>
        </div>
      ) : null}
    </div>
  )
}

export default SimuladorDesconto
