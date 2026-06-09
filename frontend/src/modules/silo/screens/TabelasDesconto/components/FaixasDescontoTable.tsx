import { Button } from '@/shared/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import type { FaixaDesconto } from '@/shared/types'
import { formatPercent } from '@/shared/utils/formatters'

type FaixasDescontoTableProps = {
  title: string
  tipo: string
  faixas: FaixaDesconto[]
  canManage: boolean
  onRemove: (faixa: FaixaDesconto) => void
}

function FaixasDescontoTable({
  title,
  tipo,
  faixas,
  canManage,
  onRemove,
}: FaixasDescontoTableProps) {
  const rows = faixas.filter((faixa) => faixa.tipo === tipo)

  return (
    <div className="rounded-md border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Intervalo</TableHead>
            <TableHead>Desconto</TableHead>
            <TableHead>Status</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((faixa) => (
            <TableRow key={faixa.id_faixa_desconto}>
              <TableCell>
                {formatPercent(faixa.valor_inicial)} a {formatPercent(faixa.valor_final)}
              </TableCell>
              <TableCell>{formatPercent(faixa.percentual_desconto)}</TableCell>
              <TableCell>{faixa.ativa === false ? 'Inativa' : 'Ativa'}</TableCell>
              <TableCell>
                <Button
                  disabled={!canManage}
                  onClick={() => onRemove(faixa)}
                  type="button"
                  variant="ghost"
                >
                  Desativar
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {!rows.length ? (
            <TableRow>
              <TableCell className="text-slate-500" colSpan={4}>
                Nenhuma faixa cadastrada.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  )
}

export default FaixasDescontoTable
