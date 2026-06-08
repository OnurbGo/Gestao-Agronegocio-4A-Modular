import { useEffect, useState } from 'react'
import StatusMessage from '@/components/feedback/StatusMessage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { normalizePaginated } from '@/services/api'
import { relatoriosApi } from '@/services/silo.service'
import type { MovimentacaoProduto, Pesagem, StatusMessageState } from '@/types'
import { asText, formatDateTime, formatKg, formatSacas } from '@/utils/formatters'
import EmptyState from '@/screens/_shared/EmptyState'
import PageHeader from '@/screens/_shared/PageHeader'
import ScreenSection from '@/screens/_shared/ScreenSection'

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Não foi possível carregar relatórios.'
}

function RelatoriosPage() {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoProduto[]>([])
  const [entradas, setEntradas] = useState<Pesagem[]>([])
  const [saidas, setSaidas] = useState<Pesagem[]>([])
  const [loteId, setLoteId] = useState('')
  const [loteResumo, setLoteResumo] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<StatusMessageState>(null)

  async function loadRelatorios() {
    setLoading(true)
    setStatus(null)

    try {
      const [loadedMovimentacoes, loadedEntradas, loadedSaidas] = await Promise.all([
        relatoriosApi.movimentacoes({ limit: 50 }),
        relatoriosApi.entradas({ limit: 50 }),
        relatoriosApi.saidas({ limit: 50 }),
      ])
      setMovimentacoes(normalizePaginated(loadedMovimentacoes, 50).items)
      setEntradas(normalizePaginated(loadedEntradas, 50).items)
      setSaidas(normalizePaginated(loadedSaidas, 50).items)
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRelatorios()
  }, [])

  async function loadLoteResumo() {
    const id = Number(loteId)
    if (!id) return

    setLoading(true)
    setStatus(null)

    try {
      setLoteResumo(await relatoriosApi.lote(id))
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="px-4 py-6 sm:px-6">
      <PageHeader
        title="Relatorios"
        description="Visões operacionais básicas de entradas, saídas, movimentações e lote operacional."
        actions={<Button disabled={loading} onClick={() => void loadRelatorios()} type="button" variant="outline">Atualizar</Button>}
      />
      <StatusMessage status={status} />

      <div className="grid gap-5">
        <ScreenSection
          title="Lote operacional"
          actions={
            <Button disabled={!loteId || loading} onClick={() => void loadLoteResumo()} type="button" variant="outline">
              Consultar lote
            </Button>
          }
        >
          <div className="grid gap-3 sm:grid-cols-[240px_minmax(0,1fr)]">
            <Input onChange={(event) => setLoteId(event.target.value)} placeholder="ID do lote" type="number" value={loteId} />
            <div className="rounded-md border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {loteResumo ? JSON.stringify(loteResumo, null, 2) : 'Informe um ID para consultar o resumo do lote.'}
            </div>
          </div>
        </ScreenSection>

        <ScreenSection title="Movimentacoes">
          {movimentacoes.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Depósito</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimentacoes.map((movimentacao) => (
                  <TableRow key={movimentacao.id_movimentacao_produto}>
                    <TableCell>{formatDateTime(movimentacao.data_movimentacao)}</TableCell>
                    <TableCell>{movimentacao.tipo_movimentacao}</TableCell>
                    <TableCell>{asText(movimentacao.conta_produto?.nome)}</TableCell>
                    <TableCell>{asText(movimentacao.deposito?.nome)}</TableCell>
                    <TableCell>{asText(movimentacao.item?.nome)}</TableCell>
                    <TableCell>{formatKg(movimentacao.quantidade_kg)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState title={loading ? 'Carregando movimentacoes...' : undefined} />
          )}
        </ScreenSection>

        <div className="grid gap-5 xl:grid-cols-2">
          <ScreenSection title="Entradas por lote">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Romaneio</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Peso final</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entradas.map((pesagem) => (
                  <TableRow key={pesagem.id_pesagem}>
                    <TableCell>{pesagem.numero_romaneio || '-'}</TableCell>
                    <TableCell>{asText(pesagem.lote_operacional?.nome)}</TableCell>
                    <TableCell>{asText(pesagem.conta_produto?.nome)}</TableCell>
                    <TableCell>{formatSacas(pesagem.classificacao?.sacas_final)}</TableCell>
                  </TableRow>
                ))}
                {!entradas.length ? <TableRow><TableCell className="text-slate-500" colSpan={4}>Nenhuma entrada localizada.</TableCell></TableRow> : null}
              </TableBody>
            </Table>
          </ScreenSection>

          <ScreenSection title="Saidas por lote">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Romaneio</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Peso final</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saidas.map((pesagem) => (
                  <TableRow key={pesagem.id_pesagem}>
                    <TableCell>{pesagem.numero_romaneio || '-'}</TableCell>
                    <TableCell>{asText(pesagem.lote_operacional?.nome)}</TableCell>
                    <TableCell>{asText(pesagem.conta_produto?.nome)}</TableCell>
                    <TableCell>{formatSacas(pesagem.classificacao?.sacas_final)}</TableCell>
                  </TableRow>
                ))}
                {!saidas.length ? <TableRow><TableCell className="text-slate-500" colSpan={4}>Nenhuma saída localizada.</TableCell></TableRow> : null}
              </TableBody>
            </Table>
          </ScreenSection>
        </div>
      </div>
    </section>
  )
}

export default RelatoriosPage
