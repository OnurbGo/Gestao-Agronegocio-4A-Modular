import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import StatusMessage from '@/components/feedback/StatusMessage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { canEdit } from '@/services/auth.service'
import { normalizePaginated } from '@/services/api'
import { dadosSaidaApi, pesagensApi } from '@/services/silo.service'
import type {
  AuthUser,
  DadosSaidaPesagem,
  Pesagem,
  StatusMessageState,
} from '@/types'
import {
  asText,
  formatDateTime,
  formatKg,
  formatMoney,
  formatPercent,
  formatSacas,
} from '@/utils/formatters'
import EmptyState from '@/screens/_shared/EmptyState'
import PageHeader from '@/screens/_shared/PageHeader'
import ScreenSection from '@/screens/_shared/ScreenSection'

type DadosSaidaPageProps = {
  usuario: AuthUser
}

type DadosSaidaForm = {
  pesagem_id: string
  numero_nota_fiscal: string
  peso_nf_kg: string
  peso_nf_sacas: string
  valor_total: string
  senar_valor: string
  funrural_valor: string
  icms_valor: string
  frete_valor: string
  corretagem_valor: string
  royalties_valor: string
  cad_pro: string
  imovel_emissor_id_ref: string
  observacao: string
}

const PAGE_SIZE = 20
const emptyForm: DadosSaidaForm = {
  pesagem_id: '',
  numero_nota_fiscal: '',
  peso_nf_kg: '',
  peso_nf_sacas: '',
  valor_total: '',
  senar_valor: '',
  funrural_valor: '',
  icms_valor: '',
  frete_valor: '',
  corretagem_valor: '',
  royalties_valor: '',
  cad_pro: '',
  imovel_emissor_id_ref: '',
  observacao: '',
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Nao foi possivel concluir.'
}

function optionalNumber(value: string) {
  return value ? Number(value) : null
}

function normalizeForm(dados?: DadosSaidaPesagem | null): DadosSaidaForm {
  return {
    pesagem_id: dados?.pesagem_id ? String(dados.pesagem_id) : '',
    numero_nota_fiscal: dados?.numero_nota_fiscal || '',
    peso_nf_kg: dados?.peso_nf_kg ? String(dados.peso_nf_kg) : '',
    peso_nf_sacas: dados?.peso_nf_sacas ? String(dados.peso_nf_sacas) : '',
    valor_total: dados?.valor_total ? String(dados.valor_total) : '',
    senar_valor: dados?.senar_valor ? String(dados.senar_valor) : '',
    funrural_valor: dados?.funrural_valor ? String(dados.funrural_valor) : '',
    icms_valor: dados?.icms_valor ? String(dados.icms_valor) : '',
    frete_valor: dados?.frete_valor ? String(dados.frete_valor) : '',
    corretagem_valor: dados?.corretagem_valor ? String(dados.corretagem_valor) : '',
    royalties_valor: dados?.royalties_valor ? String(dados.royalties_valor) : '',
    cad_pro: dados?.cad_pro || '',
    imovel_emissor_id_ref: dados?.imovel_emissor_id_ref
      ? String(dados.imovel_emissor_id_ref)
      : '',
    observacao: dados?.observacao || '',
  }
}

function buildPayload(form: DadosSaidaForm) {
  return {
    numero_nota_fiscal: form.numero_nota_fiscal.trim() || null,
    peso_nf_kg: optionalNumber(form.peso_nf_kg),
    peso_nf_sacas: optionalNumber(form.peso_nf_sacas),
    valor_total: optionalNumber(form.valor_total),
    senar_valor: optionalNumber(form.senar_valor),
    funrural_valor: optionalNumber(form.funrural_valor),
    icms_valor: optionalNumber(form.icms_valor),
    frete_valor: optionalNumber(form.frete_valor),
    corretagem_valor: optionalNumber(form.corretagem_valor),
    royalties_valor: optionalNumber(form.royalties_valor),
    cad_pro: form.cad_pro.trim() || null,
    imovel_emissor_id_ref: optionalNumber(form.imovel_emissor_id_ref),
    observacao: form.observacao.trim() || null,
  }
}

function DadosSaidaPage({ usuario }: DadosSaidaPageProps) {
  const [dadosSaida, setDadosSaida] = useState<DadosSaidaPesagem[]>([])
  const [pesagens, setPesagens] = useState<Pesagem[]>([])
  const [selectedDados, setSelectedDados] = useState<DadosSaidaPesagem | null>(null)
  const [selectedPesagem, setSelectedPesagem] = useState<Pesagem | null>(null)
  const [form, setForm] = useState<DadosSaidaForm>(emptyForm)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<StatusMessageState>(null)

  const mayEdit = canEdit(usuario, 'LANCAMENTOS_SILO')
  const automaticRows = useMemo(
    () => [
      ['Data finalizacao', formatDateTime(selectedPesagem?.finalizada_em)],
      ['Romaneio', selectedPesagem?.numero_romaneio],
      ['Placa', selectedPesagem?.placa],
      ['Conta', selectedPesagem?.conta_produto?.nome],
      ['Item', selectedPesagem?.item?.nome],
      ['Deposito', selectedPesagem?.deposito?.nome],
      ['Destino', selectedPesagem?.destino?.nome],
      ['Imovel lote ref.', selectedPesagem?.lote_operacional?.imovel_id_ref],
      ['Peso liquido', formatKg(selectedPesagem?.peso_liquido_kg)],
      ['Umidade', formatPercent(selectedPesagem?.classificacao?.umidade_percentual)],
      ['Impureza', formatPercent(selectedPesagem?.classificacao?.impureza_percentual)],
      ['Peso final', formatKg(selectedPesagem?.classificacao?.peso_final_kg)],
      ['Sacas finais', formatSacas(selectedPesagem?.classificacao?.sacas_final)],
    ],
    [selectedPesagem],
  )

  async function loadPage(nextPage = page) {
    setLoading(true)
    setStatus(null)

    try {
      const [loadedDados, loadedPesagens] = await Promise.all([
        dadosSaidaApi.list({ page: nextPage, limit: PAGE_SIZE }),
        pesagensApi.list({ tipo_operacao: 'SAIDA', limit: 100 }),
      ])
      const dadosPage = normalizePaginated(loadedDados, PAGE_SIZE)
      setDadosSaida(dadosPage.items)
      setPage(dadosPage.page)
      setTotalPages(dadosPage.totalPages)
      setPesagens(normalizePaginated(loadedPesagens, 100).items)
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPage(1)
  }, [])

  async function selectDados(dados: DadosSaidaPesagem) {
    setSelectedDados(dados)
    setForm(normalizeForm(dados))
    setSelectedPesagem(dados.pesagem || null)

    if (dados.pesagem_id && !dados.pesagem) {
      try {
        setSelectedPesagem(await pesagensApi.get(dados.pesagem_id))
      } catch {
        setSelectedPesagem(null)
      }
    }
  }

  async function selectPesagemById(value: string) {
    setForm((current) => ({ ...current, pesagem_id: value }))
    setSelectedDados(null)

    const pesagemId = Number(value)
    if (!pesagemId) {
      setSelectedPesagem(null)
      return
    }

    setLoading(true)
    setStatus(null)

    try {
      setSelectedPesagem(await pesagensApi.get(pesagemId))
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  function updateField(field: keyof DadosSaidaForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function newComplemento() {
    setSelectedDados(null)
    setSelectedPesagem(null)
    setForm(emptyForm)
    setStatus(null)
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!mayEdit) {
      setStatus({ type: 'warning', message: 'Sem permissao para salvar dados de saida.' })
      return
    }

    const pesagemId = Number(form.pesagem_id)
    if (!selectedDados && !pesagemId) {
      setStatus({ type: 'warning', message: 'Selecione uma pesagem.' })
      return
    }

    setLoading(true)
    setStatus(null)

    try {
      const saved = selectedDados
        ? await dadosSaidaApi.update(
            selectedDados.id_dados_saida_pesagem,
            buildPayload(form),
          )
        : await dadosSaidaApi.salvarPorPesagem(pesagemId, buildPayload(form))
      setSelectedDados(saved)
      setForm(normalizeForm(saved))
      setSelectedPesagem(saved.pesagem || selectedPesagem)
      setStatus({ type: 'success', message: 'Dados de saida salvos.' })
      await loadPage(page)
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="px-4 py-6 sm:px-6">
      <PageHeader
        title="Dados de Saida"
        description="Complementacao comercial e fiscal opcional, preservando os dados automaticos da pesagem."
        actions={<Button onClick={newComplemento} type="button">Novo complemento</Button>}
      />

      <StatusMessage status={status} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_500px]">
        <ScreenSection
          title="Complementos"
          actions={
            <Button disabled={loading} onClick={() => void loadPage(1)} type="button" variant="outline">
              Atualizar
            </Button>
          }
        >
          {dadosSaida.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NF</TableHead>
                  <TableHead>Romaneio</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dadosSaida.map((dados) => (
                  <TableRow
                    className={selectedDados?.id_dados_saida_pesagem === dados.id_dados_saida_pesagem ? 'bg-emerald-50' : undefined}
                    key={dados.id_dados_saida_pesagem}
                    onClick={() => void selectDados(dados)}
                  >
                    <TableCell className="font-semibold">{asText(dados.numero_nota_fiscal)}</TableCell>
                    <TableCell>{asText(dados.pesagem?.numero_romaneio)}</TableCell>
                    <TableCell>{asText(dados.pesagem?.conta_produto?.nome)}</TableCell>
                    <TableCell>{formatMoney(dados.valor_total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState title={loading ? 'Carregando dados...' : undefined} />
          )}
          <div className="mt-4 flex justify-between text-sm text-slate-600">
            <span>Pagina {page} de {totalPages}</span>
            <div className="flex gap-2">
              <Button disabled={page <= 1 || loading} onClick={() => void loadPage(page - 1)} type="button" variant="outline">Anterior</Button>
              <Button disabled={page >= totalPages || loading} onClick={() => void loadPage(page + 1)} type="button" variant="outline">Proxima</Button>
            </div>
          </div>
        </ScreenSection>

        <ScreenSection title="Complementar saida">
          <form className="grid gap-4" onSubmit={save}>
            <div>
              <Label>Pesagem de saida</Label>
              <select className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" onChange={(event) => void selectPesagemById(event.target.value)} value={form.pesagem_id}>
                <option value="">Selecione</option>
                {pesagens.map((pesagem) => (
                  <option key={pesagem.id_pesagem} value={pesagem.id_pesagem}>
                    {pesagem.numero_romaneio || pesagem.id_pesagem} - {pesagem.placa || 'sem placa'}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-md border border-slate-100 bg-slate-50 p-4">
              <h3 className="text-sm font-bold text-slate-700">Dados automaticos</h3>
              <div className="mt-3 grid gap-2 text-sm">
                {automaticRows.map(([label, value]) => (
                  <div className="flex justify-between gap-4 border-b border-slate-200/70 py-1.5" key={label}>
                    <span className="font-semibold text-slate-600">{label}</span>
                    <span className="text-right">{asText(value)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Numero NF" value={form.numero_nota_fiscal} onChange={(event) => updateField('numero_nota_fiscal', event.target.value)} />
              <Input placeholder="CAD/Pro" value={form.cad_pro} onChange={(event) => updateField('cad_pro', event.target.value)} />
              <Input placeholder="Peso NF kg" type="number" value={form.peso_nf_kg} onChange={(event) => updateField('peso_nf_kg', event.target.value)} />
              <Input placeholder="Peso NF sacas" type="number" value={form.peso_nf_sacas} onChange={(event) => updateField('peso_nf_sacas', event.target.value)} />
              <Input placeholder="Valor total" type="number" value={form.valor_total} onChange={(event) => updateField('valor_total', event.target.value)} />
              <Input placeholder="Senar" type="number" value={form.senar_valor} onChange={(event) => updateField('senar_valor', event.target.value)} />
              <Input placeholder="Funrural" type="number" value={form.funrural_valor} onChange={(event) => updateField('funrural_valor', event.target.value)} />
              <Input placeholder="ICMS" type="number" value={form.icms_valor} onChange={(event) => updateField('icms_valor', event.target.value)} />
              <Input placeholder="Frete" type="number" value={form.frete_valor} onChange={(event) => updateField('frete_valor', event.target.value)} />
              <Input placeholder="Corretagem" type="number" value={form.corretagem_valor} onChange={(event) => updateField('corretagem_valor', event.target.value)} />
              <Input placeholder="Royalties" type="number" value={form.royalties_valor} onChange={(event) => updateField('royalties_valor', event.target.value)} />
              <Input placeholder="Imovel emissor ref." type="number" value={form.imovel_emissor_id_ref} onChange={(event) => updateField('imovel_emissor_id_ref', event.target.value)} />
            </div>
            <Textarea placeholder="Observacao" value={form.observacao} onChange={(event) => updateField('observacao', event.target.value)} />
            <div className="flex gap-2">
              <Button disabled={loading || !mayEdit} type="submit">Salvar parcial</Button>
              <Button onClick={newComplemento} type="button" variant="outline">Limpar</Button>
            </div>
          </form>
        </ScreenSection>
      </div>
    </section>
  )
}

export default DadosSaidaPage
