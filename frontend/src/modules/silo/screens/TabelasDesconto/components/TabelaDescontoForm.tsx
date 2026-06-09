import type { FormEvent } from 'react'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import type { ItemSilo, TabelaDesconto } from '@/shared/types'

export type TabelaDescontoFormState = {
  item_id: string
  nome: string
  ativa: boolean
  vigencia_inicio: string
  vigencia_fim: string
}

type TabelaDescontoFormProps = {
  form: TabelaDescontoFormState
  itens: ItemSilo[]
  loading: boolean
  canManage: boolean
  selected: TabelaDesconto | null
  onChange: (form: TabelaDescontoFormState) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onClear: () => void
}

function TabelaDescontoForm({
  form,
  itens,
  loading,
  canManage,
  selected,
  onChange,
  onSubmit,
  onClear,
}: TabelaDescontoFormProps) {
  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div>
        <Label>Item *</Label>
        <select
          className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
          onChange={(event) => onChange({ ...form, item_id: event.target.value })}
          required
          value={form.item_id}
        >
          <option value="">Selecione</option>
          {itens.map((item) => (
            <option key={item.id_item} value={item.id_item}>
              {item.nome}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Nome *</Label>
        <Input
          className="mt-2"
          onChange={(event) => onChange({ ...form, nome: event.target.value })}
          required
          value={form.nome}
        />
      </div>
      <label className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold">
        <Checkbox
          checked={form.ativa}
          onCheckedChange={(checked) => onChange({ ...form, ativa: Boolean(checked) })}
        />
        Tabela ativa
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Início vigência</Label>
          <Input
            className="mt-2"
            onChange={(event) =>
              onChange({ ...form, vigencia_inicio: event.target.value })
            }
            type="date"
            value={form.vigencia_inicio}
          />
        </div>
        <div>
          <Label>Fim vigência</Label>
          <Input
            className="mt-2"
            onChange={(event) => onChange({ ...form, vigencia_fim: event.target.value })}
            type="date"
            value={form.vigencia_fim}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button disabled={loading || !canManage} type="submit">
          {selected ? 'Salvar tabela' : 'Criar tabela'}
        </Button>
        <Button onClick={onClear} type="button" variant="outline">
          Limpar
        </Button>
      </div>
    </form>
  )
}

export default TabelaDescontoForm
