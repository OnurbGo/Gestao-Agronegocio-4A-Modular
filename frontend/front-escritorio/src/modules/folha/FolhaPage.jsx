import { useEffect, useMemo, useState } from 'react'
import { atualizarEntidade, listarEntidades } from '../entidades/entidades.service'
import Modal from '../../shared/components/Modal'
import StatusMessage from '../../shared/components/StatusMessage'
import {
  buscarParticipante,
  buscarRelatorioMensal,
  criarFerias,
  criarRegistroSalarial,
  exportarLancamentosMensais,
  exportarRelatorioMensal,
  listarLancamentosMensais,
  listarParticipantes,
  salvarLancamentosMensais,
} from './folha.service'

const meses = [
  { valor: 1, label: 'Janeiro' },
  { valor: 2, label: 'Fevereiro' },
  { valor: 3, label: 'Março' },
  { valor: 4, label: 'Abril' },
  { valor: 5, label: 'Maio' },
  { valor: 6, label: 'Junho' },
  { valor: 7, label: 'Julho' },
  { valor: 8, label: 'Agosto' },
  { valor: 9, label: 'Setembro' },
  { valor: 10, label: 'Outubro' },
  { valor: 11, label: 'Novembro' },
  { valor: 12, label: 'Dezembro' },
]

const camposEditaveis = [
  'dias_trabalhados',
  'salario_bruto',
  'inss',
  'irrf',
  'inss_adicional',
  'ferias',
  'comissao',
  'desconto_bar',
  'desconto_diverso_1',
  'desconto_diverso_2',
  'desconto_diverso_3',
]

const descontoCampos = [
  { campo: 'desconto_bar', label: 'Bar' },
  { campo: 'desconto_diverso_1', label: 'Desconto diverso 1' },
  { campo: 'desconto_diverso_2', label: 'Desconto diverso 2' },
  { campo: 'desconto_diverso_3', label: 'Desconto diverso 3' },
]

const salarioInicial = {
  inicio_vigencia: '',
  salario: '',
  percentual: '',
  observacao: '',
}

const feriasInicial = {
  periodo_aquisitivo_inicio: '',
  periodo_aquisitivo_fim: '',
  dias_totais: '',
  dias_gozados: '',
  valor_abono: '',
  periodo_inicio: '',
  periodo_fim: '',
  data_retorno: '',
}

function numero(value) {
  if (value === '' || value === null || value === undefined) return 0
  const parsed = Number(String(value).replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

function dinheiro(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numero(value))
}

function totalDescontos(linha) {
  return descontoCampos.reduce((total, item) => total + numero(linha[item.campo]), 0)
}

function calcularLinha(linha) {
  const salarioLiquido =
    numero(linha.salario_bruto) +
    numero(linha.ferias) +
    numero(linha.comissao) -
    numero(linha.inss) -
    numero(linha.irrf) -
    numero(linha.inss_adicional)

  const descontos = totalDescontos(linha)

  return {
    ...linha,
    salario_liquido: salarioLiquido.toFixed(2),
    salario_liquido_com_desconto: (salarioLiquido - descontos).toFixed(2),
  }
}

function criarLinhaBase(mes) {
  return calcularLinha({
    mes,
    dias_trabalhados: '',
    salario_bruto: '',
    inss: '',
    irrf: '',
    inss_adicional: '',
    ferias: '',
    comissao: '',
    desconto_bar: '',
    desconto_diverso_1: '',
    desconto_diverso_2: '',
    desconto_diverso_3: '',
    salario_liquido: '0.00',
    salario_liquido_com_desconto: '0.00',
  })
}

function normalizarLinha(registro, mes) {
  if (!registro) return criarLinhaBase(mes)

  return calcularLinha({
    ...criarLinhaBase(mes),
    ...Object.fromEntries(
      Object.entries(registro).map(([key, value]) => [
        key,
        value === null || value === undefined ? '' : String(value),
      ]),
    ),
    mes,
  })
}

function montarPayload(linhas) {
  return linhas.map((linha) => {
    const payload = {
      mes: Number(linha.mes),
      dias_trabalhados: Number(linha.dias_trabalhados || 0),
    }

    camposEditaveis
      .filter((campo) => campo !== 'dias_trabalhados')
      .forEach((campo) => {
        payload[campo] = numero(linha[campo])
      })

    return payload
  })
}

function MoneyInput({ value, onChange }) {
  return (
    <input
      className="cell-input"
      min="0"
      onChange={(event) => onChange(event.target.value)}
      step="0.01"
      type="number"
      value={value}
    />
  )
}

function FolhaPage({ onBack }) {
  const anoAtual = new Date().getFullYear()
  const mesAtual = new Date().getMonth() + 1

  const [aba, setAba] = useState('relatorio')
  const [termo, setTermo] = useState('')
  const [ano, setAno] = useState(anoAtual)
  const [mesRelatorio, setMesRelatorio] = useState(mesAtual)
  const [participantes, setParticipantes] = useState([])
  const [participanteId, setParticipanteId] = useState(null)
  const [detalhe, setDetalhe] = useState(null)
  const [linhas, setLinhas] = useState(() =>
    meses.map((mes) => criarLinhaBase(mes.valor)),
  )
  const [relatorio, setRelatorio] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [status, setStatus] = useState(null)
  const [alterado, setAlterado] = useState(false)
  const [modalAberto, setModalAberto] = useState(null)
  const [mesDescontos, setMesDescontos] = useState(null)
  const [entidadesFolha, setEntidadesFolha] = useState([])
  const [termoEntidadesFolha, setTermoEntidadesFolha] = useState('')
  const [carregandoEntidadesFolha, setCarregandoEntidadesFolha] = useState(false)
  const [salvandoParticipante, setSalvandoParticipante] = useState(null)
  const [salarioForm, setSalarioForm] = useState(salarioInicial)
  const [feriasForm, setFeriasForm] = useState(feriasInicial)

  useEffect(() => {
    let active = true

    async function carregar() {
      setStatus(null)

      try {
        const data = await listarParticipantes({ termo })

        if (!active) return
        setParticipantes(data)
        setParticipanteId((current) => current || data[0]?.id_entidade || null)
      } catch (error) {
        if (active) setStatus({ type: 'error', message: error.message })
      }
    }

    carregar()
    return () => {
      active = false
    }
  }, [termo])

  useEffect(() => {
    if (!participanteId) {
      return
    }

    let active = true

    async function carregar() {
      setCarregando(true)
      setStatus(null)

      try {
        const [participante, lancamentos] = await Promise.all([
          buscarParticipante(participanteId),
          listarLancamentosMensais(participanteId, ano),
        ])
        const porMes = new Map(
          lancamentos.map((linha) => [Number(linha.mes), linha]),
        )

        if (!active) return
        setDetalhe(participante)
        setLinhas(
          meses.map((mes) => normalizarLinha(porMes.get(mes.valor), mes.valor)),
        )
        setAlterado(false)
      } catch (error) {
        if (active) setStatus({ type: 'error', message: error.message })
      } finally {
        if (active) setCarregando(false)
      }
    }

    carregar()
    return () => {
      active = false
    }
  }, [participanteId, ano])

  useEffect(() => {
    let active = true

    async function carregar() {
      try {
        const data = await buscarRelatorioMensal({ ano, mes: mesRelatorio })
        if (active) setRelatorio(data)
      } catch {
        if (active) setRelatorio(null)
      }
    }

    carregar()
    return () => {
      active = false
    }
  }, [ano, mesRelatorio])

  const totais = useMemo(
    () =>
      linhas.reduce(
        (acc, linha) => ({
          bruto: acc.bruto + numero(linha.salario_bruto),
          liquido: acc.liquido + numero(linha.salario_liquido),
          final: acc.final + numero(linha.salario_liquido_com_desconto),
        }),
        { bruto: 0, liquido: 0, final: 0 },
      ),
    [linhas],
  )

  const entidadesFiltradasFolha = useMemo(() => {
    const termoNormalizado = termoEntidadesFolha.trim().toLowerCase()
    if (!termoNormalizado) return entidadesFolha

    return entidadesFolha.filter((entidade) =>
      [entidade.nome, entidade.cpf_cnpj]
        .filter(Boolean)
        .some((valor) => String(valor).toLowerCase().includes(termoNormalizado)),
    )
  }, [entidadesFolha, termoEntidadesFolha])

  const linhaDescontos = useMemo(
    () => linhas.find((linha) => linha.mes === mesDescontos),
    [linhas, mesDescontos],
  )

  async function carregarRelatorio() {
    try {
      const data = await buscarRelatorioMensal({ ano, mes: mesRelatorio })
      setRelatorio(data)
    } catch {
      setRelatorio(null)
    }
  }

  async function recarregarParticipantes() {
    const data = await listarParticipantes({ termo })
    const proximoId = data.some(
      (participante) => participante.id_entidade === participanteId,
    )
      ? participanteId
      : data[0]?.id_entidade || null

    setParticipantes(data)
    setParticipanteId(proximoId)

    if (!proximoId) {
      setDetalhe(null)
      setLinhas(meses.map((mes) => criarLinhaBase(mes.valor)))
      setAlterado(false)
    }
  }

  function alterarLinha(mes, campo, valor) {
    setLinhas((atuais) =>
      atuais.map((linha) =>
        linha.mes === mes ? calcularLinha({ ...linha, [campo]: valor }) : linha,
      ),
    )
    setAlterado(true)
    setStatus(null)
  }

  function abrirDescontos(mes) {
    setMesDescontos(mes)
    setModalAberto('descontos')
  }

  async function abrirParticipantes() {
    setModalAberto('participantes')
    setCarregandoEntidadesFolha(true)
    setStatus(null)

    try {
      const data = await listarEntidades({ ativo: true })
      setEntidadesFolha(data)
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setCarregandoEntidadesFolha(false)
    }
  }

  async function alternarParticipacao(entidade) {
    const id = entidade.id_entidade
    const participa = !entidade.participa_folha

    setSalvandoParticipante(id)
    setStatus(null)

    try {
      const atualizada = await atualizarEntidade(id, { participa_folha: participa })
      setEntidadesFolha((atuais) =>
        atuais.map((item) =>
          item.id_entidade === id
            ? { ...item, participa_folha: atualizada.participa_folha }
            : item,
        ),
      )
      await recarregarParticipantes()
      await carregarRelatorio()
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setSalvandoParticipante(null)
    }
  }

  async function salvar() {
    if (!participanteId) return
    setSalvando(true)
    setStatus(null)

    try {
      const registros = await salvarLancamentosMensais(
        participanteId,
        Number(ano),
        montarPayload(linhas),
      )
      const porMes = new Map(registros.map((linha) => [Number(linha.mes), linha]))
      setLinhas(meses.map((mes) => normalizarLinha(porMes.get(mes.valor), mes.valor)))
      setAlterado(false)
      setStatus({ type: 'success', message: 'Lançamentos salvos.' })
      await carregarRelatorio()
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setSalvando(false)
    }
  }

  async function exportar() {
    if (!participanteId || alterado) return
    setExportando(true)
    setStatus(null)

    try {
      await exportarLancamentosMensais(participanteId, ano, detalhe?.nome)
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setExportando(false)
    }
  }

  async function adicionarSalario(event) {
    event.preventDefault()
    if (!participanteId) return

    setStatus(null)
    try {
      await criarRegistroSalarial(participanteId, {
        ...salarioForm,
        percentual: salarioForm.percentual || null,
      })
      const participante = await buscarParticipante(participanteId)
      setDetalhe(participante)
      setSalarioForm(salarioInicial)
      setStatus({ type: 'success', message: 'Registro salarial criado.' })
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    }
  }

  async function adicionarFerias(event) {
    event.preventDefault()
    if (!participanteId) return

    setStatus(null)
    try {
      await criarFerias(participanteId, {
        ...feriasForm,
        valor_abono: feriasForm.valor_abono || null,
      })
      const participante = await buscarParticipante(participanteId)
      setDetalhe(participante)
      setFeriasForm(feriasInicial)
      setStatus({ type: 'success', message: 'Férias cadastradas.' })
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    }
  }

  async function exportarRelatorio() {
    setStatus(null)
    try {
      await exportarRelatorioMensal({ ano, mes: mesRelatorio })
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    }
  }

  function imprimirRelatorio() {
    window.print()
  }

  return (
    <main className="workspace-page payroll-page">
      <section className="page-heading no-print">
        <button className="ghost-button" onClick={onBack} type="button">
          Voltar
        </button>
        <div>
          <span>Folha</span>
          <h1>Folha de Pagamento</h1>
        </div>
      </section>

      <StatusMessage status={status} />

      {alterado ? (
        <StatusMessage
          status={{
            type: 'warning',
            message: 'Existem alterações pendentes. Salve antes de exportar.',
          }}
        />
      ) : null}

      <div className="tabs no-print">
        <button
          className={aba === 'relatorio' ? 'active' : ''}
          onClick={() => setAba('relatorio')}
          type="button"
        >
          Relatório mensal
        </button>
        <button
          className={aba === 'lancamentos' ? 'active' : ''}
          onClick={() => setAba('lancamentos')}
          type="button"
        >
          Lançamentos
        </button>
      </div>

      {aba === 'relatorio' ? (
        <section className="report-page print-area">
          <section className="panel report-toolbar no-print">
            <label>
              Ano
              <input
                max="2100"
                min="2000"
                onChange={(event) => setAno(Number(event.target.value))}
                type="number"
                value={ano}
              />
            </label>
            <label>
              Mês
              <select
                onChange={(event) => setMesRelatorio(Number(event.target.value))}
                value={mesRelatorio}
              >
                {meses.map((mes) => (
                  <option key={mes.valor} value={mes.valor}>
                    {mes.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="secondary-button"
              disabled={!relatorio?.itens?.length}
              onClick={imprimirRelatorio}
              type="button"
            >
              Imprimir
            </button>
            <button
              className="primary-button"
              disabled={!relatorio?.itens?.length}
              onClick={exportarRelatorio}
              type="button"
            >
              Exportar planilha
            </button>
          </section>

          <section className="panel printable-report">
            <div className="report-title">
              <span>Relatório mensal</span>
              <h2>
                {relatorio?.nome_mes || meses[mesRelatorio - 1]?.label} / {ano}
              </h2>
            </div>
            <div className="summary-grid">
              <div>
                <span>Lançamentos</span>
                <strong>{relatorio?.itens?.length || 0}</strong>
              </div>
              <div>
                <span>Total líquido</span>
                <strong>{dinheiro(relatorio?.total)}</strong>
              </div>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Participante</th>
                    <th>Bruto</th>
                    <th>Líquido</th>
                    <th>Final</th>
                  </tr>
                </thead>
                <tbody>
                  {(relatorio?.itens || []).map((item) => (
                    <tr key={item.id_folha_mensal}>
                      <td>{item.entidade?.nome}</td>
                      <td>{dinheiro(item.salario_bruto)}</td>
                      <td>{dinheiro(item.salario_liquido)}</td>
                      <td>{dinheiro(item.salario_liquido_com_desconto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!relatorio?.itens?.length ? (
                <p className="empty-state">Nenhum lançamento no período.</p>
              ) : null}
            </div>
          </section>
        </section>
      ) : (
        <section className="payroll-layout">
          <aside className="panel list-panel">
            <div className="panel-heading">
              <h2>Participantes</h2>
              <span>{participantes.length}</span>
            </div>
            <button
              className="primary-button full"
              onClick={abrirParticipantes}
              type="button"
            >
              Gerenciar participantes
            </button>
            <input
              onChange={(event) => setTermo(event.target.value)}
              placeholder="Buscar participante"
              type="search"
              value={termo}
            />
            <div className="record-list">
              {participantes.map((participante) => (
                <button
                  className={`record-row ${
                    participante.id_entidade === participanteId ? 'active' : ''
                  }`}
                  key={participante.id_entidade}
                  onClick={() => setParticipanteId(participante.id_entidade)}
                  type="button"
                >
                  <strong>{participante.nome}</strong>
                  <span>{participante.cpf_cnpj}</span>
                  <small>{dinheiro(participante.salario_atual)}</small>
                </button>
              ))}
              {!participantes.length ? (
                <p className="empty-state">Nenhum participante encontrado.</p>
              ) : null}
            </div>
          </aside>

          <section className="detail-stack">
            <section className="summary-grid">
              <div>
                <span>Participante</span>
                <strong>{detalhe?.nome || '-'}</strong>
              </div>
              <div>
                <span>Salário atual</span>
                <strong>{dinheiro(detalhe?.salario_atual)}</strong>
              </div>
              <div>
                <span>Total bruto</span>
                <strong>{dinheiro(totais.bruto)}</strong>
              </div>
              <div>
                <span>Total final</span>
                <strong>{dinheiro(totais.final)}</strong>
              </div>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <h2>Lançamentos de {ano}</h2>
                <div className="row-actions">
                  <label className="compact-field">
                    Ano
                    <input
                      max="2100"
                      min="2000"
                      onChange={(event) => setAno(Number(event.target.value))}
                      type="number"
                      value={ano}
                    />
                  </label>
                  <button
                    className="secondary-button"
                    disabled={!participanteId || alterado || exportando}
                    onClick={exportar}
                    title={alterado ? 'Salve antes de exportar' : 'Exportar planilha'}
                    type="button"
                  >
                    {exportando ? 'Exportando...' : 'Exportar como planilha'}
                  </button>
                  <button
                    className="primary-button"
                    disabled={!participanteId || salvando || carregando}
                    onClick={salvar}
                    type="button"
                  >
                    {salvando ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
              <div className="table-scroll">
                <table className="payroll-table">
                  <thead>
                    <tr>
                      <th>Mês</th>
                      <th>Dias</th>
                      <th>Bruto</th>
                      <th>INSS</th>
                      <th>IRRF</th>
                      <th>INSS adic.</th>
                      <th>Férias</th>
                      <th>Comissão</th>
                      <th>Líquido</th>
                      <th>Descontos</th>
                      <th>Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhas.map((linha) => (
                      <tr key={linha.mes}>
                        <td>{meses[Number(linha.mes) - 1]?.label}</td>
                        <td>
                          <input
                            className="cell-input small"
                            max="31"
                            min="0"
                            onChange={(event) =>
                              alterarLinha(
                                linha.mes,
                                'dias_trabalhados',
                                event.target.value,
                              )
                            }
                            type="number"
                            value={linha.dias_trabalhados}
                          />
                        </td>
                        <td>
                          <MoneyInput
                            onChange={(value) =>
                              alterarLinha(linha.mes, 'salario_bruto', value)
                            }
                            value={linha.salario_bruto}
                          />
                        </td>
                        <td>
                          <MoneyInput
                            onChange={(value) =>
                              alterarLinha(linha.mes, 'inss', value)
                            }
                            value={linha.inss}
                          />
                        </td>
                        <td>
                          <MoneyInput
                            onChange={(value) =>
                              alterarLinha(linha.mes, 'irrf', value)
                            }
                            value={linha.irrf}
                          />
                        </td>
                        <td>
                          <MoneyInput
                            onChange={(value) =>
                              alterarLinha(linha.mes, 'inss_adicional', value)
                            }
                            value={linha.inss_adicional}
                          />
                        </td>
                        <td>
                          <MoneyInput
                            onChange={(value) =>
                              alterarLinha(linha.mes, 'ferias', value)
                            }
                            value={linha.ferias}
                          />
                        </td>
                        <td>
                          <MoneyInput
                            onChange={(value) =>
                              alterarLinha(linha.mes, 'comissao', value)
                            }
                            value={linha.comissao}
                          />
                        </td>
                        <td>{dinheiro(linha.salario_liquido)}</td>
                        <td>
                          <div className="discount-cell">
                            <span>{dinheiro(totalDescontos(linha))}</span>
                            <button
                              className="secondary-button tiny-button"
                              onClick={() => abrirDescontos(linha.mes)}
                              type="button"
                            >
                              Editar
                            </button>
                          </div>
                        </td>
                        <td>{dinheiro(linha.salario_liquido_com_desconto)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="lower-grid">
              <section className="panel">
                <div className="panel-heading">
                  <h2>Registros salariais</h2>
                  <span>{detalhe?.registros_salariais?.length || 0}</span>
                </div>
                <button
                  className="secondary-button full"
                  disabled={!participanteId}
                  onClick={() => setModalAberto('salarios')}
                  type="button"
                >
                  Gerenciar salários
                </button>
                <div className="mini-list">
                  {(detalhe?.registros_salariais || []).slice(0, 5).map((registro) => (
                    <div key={registro.id_registro_salarial}>
                      <strong>{dinheiro(registro.salario)}</strong>
                      <span>{registro.inicio_vigencia}</span>
                    </div>
                  ))}
                  {!detalhe?.registros_salariais?.length ? (
                    <p className="empty-state">Nenhum registro salarial.</p>
                  ) : null}
                </div>
              </section>

              <section className="panel">
                <div className="panel-heading">
                  <h2>Férias</h2>
                  <span>{detalhe?.ferias?.length || 0}</span>
                </div>
                <button
                  className="secondary-button full"
                  disabled={!participanteId}
                  onClick={() => setModalAberto('ferias')}
                  type="button"
                >
                  Gerenciar férias
                </button>
                <div className="mini-list">
                  {(detalhe?.ferias || []).slice(0, 5).map((item) => (
                    <div key={item.id_ferias}>
                      <strong>
                        {item.dias_gozados}/{item.dias_totais} dias
                      </strong>
                      <span>
                        {item.periodo_aquisitivo_inicio} a {item.periodo_aquisitivo_fim}
                      </span>
                    </div>
                  ))}
                  {!detalhe?.ferias?.length ? (
                    <p className="empty-state">Nenhum registro de férias.</p>
                  ) : null}
                </div>
              </section>
            </section>
          </section>
        </section>
      )}

      {modalAberto === 'participantes' ? (
        <Modal
          onClose={() => setModalAberto(null)}
          title="Gerenciar participantes da folha"
          width="lg"
        >
          <div className="modal-body">
            <input
              onChange={(event) => setTermoEntidadesFolha(event.target.value)}
              placeholder="Buscar entidade"
              type="search"
              value={termoEntidadesFolha}
            />
            <div className="toggle-list">
              {entidadesFiltradasFolha.map((entidade) => (
                <button
                  className="toggle-row"
                  disabled={salvandoParticipante === entidade.id_entidade}
                  key={entidade.id_entidade}
                  onClick={() => alternarParticipacao(entidade)}
                  type="button"
                >
                  <span>
                    <strong>{entidade.nome}</strong>
                    <small>{entidade.cpf_cnpj || 'Sem documento'}</small>
                  </span>
                  <span
                    className={`toggle-pill ${
                      entidade.participa_folha ? 'active' : ''
                    }`}
                  >
                    {entidade.participa_folha ? 'Na folha' : 'Fora da folha'}
                  </span>
                </button>
              ))}
              {!entidadesFiltradasFolha.length ? (
                <p className="empty-state">
                  {carregandoEntidadesFolha
                    ? 'Carregando entidades...'
                    : 'Nenhuma entidade encontrada.'}
                </p>
              ) : null}
            </div>
          </div>
        </Modal>
      ) : null}

      {modalAberto === 'descontos' && linhaDescontos ? (
        <Modal
          onClose={() => setModalAberto(null)}
          title={`Descontos de ${meses[Number(linhaDescontos.mes) - 1]?.label}`}
        >
          <div className="modal-body">
            <div className="form-grid one-column">
              {descontoCampos.map((item) => (
                <label key={item.campo}>
                  {item.label}
                  <MoneyInput
                    onChange={(value) => alterarLinha(linhaDescontos.mes, item.campo, value)}
                    value={linhaDescontos[item.campo]}
                  />
                </label>
              ))}
            </div>
            <div className="modal-summary">
              <span>Total de descontos</span>
              <strong>{dinheiro(totalDescontos(linhaDescontos))}</strong>
            </div>
            <div className="form-actions">
              <button
                className="primary-button"
                onClick={() => setModalAberto(null)}
                type="button"
              >
                Aplicar
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {modalAberto === 'salarios' ? (
        <Modal onClose={() => setModalAberto(null)} title="Registros salariais">
          <div className="modal-body">
            <form className="compact-form" onSubmit={adicionarSalario}>
              <label>
                Início
                <input
                  onChange={(event) =>
                    setSalarioForm((form) => ({
                      ...form,
                      inicio_vigencia: event.target.value,
                    }))
                  }
                  required
                  type="date"
                  value={salarioForm.inicio_vigencia}
                />
              </label>
              <label>
                Salário
                <input
                  min="0"
                  onChange={(event) =>
                    setSalarioForm((form) => ({
                      ...form,
                      salario: event.target.value,
                    }))
                  }
                  required
                  step="0.01"
                  type="number"
                  value={salarioForm.salario}
                />
              </label>
              <label>
                Percentual
                <input
                  min="0"
                  onChange={(event) =>
                    setSalarioForm((form) => ({
                      ...form,
                      percentual: event.target.value,
                    }))
                  }
                  step="0.01"
                  type="number"
                  value={salarioForm.percentual}
                />
              </label>
              <label>
                Observação
                <input
                  onChange={(event) =>
                    setSalarioForm((form) => ({
                      ...form,
                      observacao: event.target.value,
                    }))
                  }
                  value={salarioForm.observacao}
                />
              </label>
              <button className="primary-button" type="submit">
                Adicionar
              </button>
            </form>
            <div className="mini-list">
              {(detalhe?.registros_salariais || []).map((registro) => (
                <div key={registro.id_registro_salarial}>
                  <strong>{dinheiro(registro.salario)}</strong>
                  <span>{registro.inicio_vigencia}</span>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      ) : null}

      {modalAberto === 'ferias' ? (
        <Modal onClose={() => setModalAberto(null)} title="Registro de férias" width="lg">
          <div className="modal-body">
            <form className="compact-form" onSubmit={adicionarFerias}>
              <label>
                Aquisitivo início
                <input
                  onChange={(event) =>
                    setFeriasForm((form) => ({
                      ...form,
                      periodo_aquisitivo_inicio: event.target.value,
                    }))
                  }
                  required
                  type="date"
                  value={feriasForm.periodo_aquisitivo_inicio}
                />
              </label>
              <label>
                Aquisitivo fim
                <input
                  onChange={(event) =>
                    setFeriasForm((form) => ({
                      ...form,
                      periodo_aquisitivo_fim: event.target.value,
                    }))
                  }
                  required
                  type="date"
                  value={feriasForm.periodo_aquisitivo_fim}
                />
              </label>
              <label>
                Dias totais
                <input
                  min="0"
                  onChange={(event) =>
                    setFeriasForm((form) => ({
                      ...form,
                      dias_totais: event.target.value,
                    }))
                  }
                  required
                  type="number"
                  value={feriasForm.dias_totais}
                />
              </label>
              <label>
                Dias gozados
                <input
                  min="0"
                  onChange={(event) =>
                    setFeriasForm((form) => ({
                      ...form,
                      dias_gozados: event.target.value,
                    }))
                  }
                  type="number"
                  value={feriasForm.dias_gozados}
                />
              </label>
              <label>
                Valor abono
                <input
                  min="0"
                  onChange={(event) =>
                    setFeriasForm((form) => ({
                      ...form,
                      valor_abono: event.target.value,
                    }))
                  }
                  step="0.01"
                  type="number"
                  value={feriasForm.valor_abono}
                />
              </label>
              <label>
                Início gozado
                <input
                  onChange={(event) =>
                    setFeriasForm((form) => ({
                      ...form,
                      periodo_inicio: event.target.value,
                    }))
                  }
                  type="date"
                  value={feriasForm.periodo_inicio}
                />
              </label>
              <label>
                Fim gozado
                <input
                  onChange={(event) =>
                    setFeriasForm((form) => ({
                      ...form,
                      periodo_fim: event.target.value,
                    }))
                  }
                  type="date"
                  value={feriasForm.periodo_fim}
                />
              </label>
              <label>
                Retorno
                <input
                  onChange={(event) =>
                    setFeriasForm((form) => ({
                      ...form,
                      data_retorno: event.target.value,
                    }))
                  }
                  type="date"
                  value={feriasForm.data_retorno}
                />
              </label>
              <button className="primary-button" type="submit">
                Adicionar
              </button>
            </form>
            <div className="mini-list">
              {(detalhe?.ferias || []).map((item) => (
                <div key={item.id_ferias}>
                  <strong>
                    {item.dias_gozados}/{item.dias_totais} dias
                  </strong>
                  <span>
                    {item.periodo_aquisitivo_inicio} a {item.periodo_aquisitivo_fim}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      ) : null}
    </main>
  )
}

export default FolhaPage
