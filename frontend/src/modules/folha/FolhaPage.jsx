import { useEffect, useMemo, useState } from "react";
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
} from "./folha.service";

const meses = [
  { valor: 1, label: "Janeiro" },
  { valor: 2, label: "Fevereiro" },
  { valor: 3, label: "Marco" },
  { valor: 4, label: "Abril" },
  { valor: 5, label: "Maio" },
  { valor: 6, label: "Junho" },
  { valor: 7, label: "Julho" },
  { valor: 8, label: "Agosto" },
  { valor: 9, label: "Setembro" },
  { valor: 10, label: "Outubro" },
  { valor: 11, label: "Novembro" },
  { valor: 12, label: "Dezembro" },
];

const camposEditaveis = [
  "dias_trabalhados",
  "salario_bruto",
  "inss",
  "irrf",
  "inss_adicional",
  "ferias",
  "comissao",
  "desconto_bar",
  "desconto_diverso_1",
  "desconto_diverso_2",
  "desconto_diverso_3",
];

function numero(value) {
  if (value === "" || value === null || value === undefined) return 0;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function dinheiro(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numero(value));
}

function calcularLinha(linha) {
  const salarioLiquido =
    numero(linha.salario_bruto) +
    numero(linha.ferias) +
    numero(linha.comissao) -
    numero(linha.inss) -
    numero(linha.irrf) -
    numero(linha.inss_adicional);

  const descontos =
    numero(linha.desconto_bar) +
    numero(linha.desconto_diverso_1) +
    numero(linha.desconto_diverso_2) +
    numero(linha.desconto_diverso_3);

  return {
    ...linha,
    salario_liquido: salarioLiquido.toFixed(2),
    salario_liquido_com_desconto: (salarioLiquido - descontos).toFixed(2),
  };
}

function criarLinhaBase(mes) {
  return calcularLinha({
    mes,
    dias_trabalhados: "",
    salario_bruto: "",
    inss: "",
    irrf: "",
    inss_adicional: "",
    ferias: "",
    comissao: "",
    desconto_bar: "",
    desconto_diverso_1: "",
    desconto_diverso_2: "",
    desconto_diverso_3: "",
    salario_liquido: "0.00",
    salario_liquido_com_desconto: "0.00",
  });
}

function normalizarLinha(registro, mes) {
  if (!registro) return criarLinhaBase(mes);

  return calcularLinha({
    ...criarLinhaBase(mes),
    ...Object.fromEntries(
      Object.entries(registro).map(([key, value]) => [
        key,
        value === null || value === undefined ? "" : String(value),
      ]),
    ),
    mes,
  });
}

function montarPayload(linhas) {
  return linhas.map((linha) => {
    const payload = {
      mes: Number(linha.mes),
      dias_trabalhados: Number(linha.dias_trabalhados || 0),
    };

    camposEditaveis
      .filter((campo) => campo !== "dias_trabalhados")
      .forEach((campo) => {
        payload[campo] = numero(linha[campo]);
      });

    return payload;
  });
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function MoneyInput({ value, onChange, disabled }) {
  return (
    <input
      className="cell-input"
      type="number"
      min="0"
      step="0.01"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function FolhaPage() {
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;

  const [termo, setTermo] = useState("");
  const [ano, setAno] = useState(anoAtual);
  const [mesRelatorio, setMesRelatorio] = useState(mesAtual);
  const [participantes, setParticipantes] = useState([]);
  const [participanteId, setParticipanteId] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const [linhas, setLinhas] = useState(() =>
    meses.map((mes) => criarLinhaBase(mes.valor)),
  );
  const [relatorio, setRelatorio] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [alterado, setAlterado] = useState(false);
  const [salarioForm, setSalarioForm] = useState({
    inicio_vigencia: "",
    salario: "",
    percentual: "",
    observacao: "",
  });
  const [feriasForm, setFeriasForm] = useState({
    periodo_aquisitivo_inicio: "",
    periodo_aquisitivo_fim: "",
    dias_totais: "",
    dias_gozados: "",
    valor_abono: "",
    periodo_inicio: "",
    periodo_fim: "",
    data_retorno: "",
  });

  useEffect(() => {
    let ativo = true;

    async function carregarParticipantes() {
      setErro("");
      try {
        const data = await listarParticipantes({ termo });
        if (!ativo) return;
        setParticipantes(data);
        setParticipanteId((atual) => atual || data[0]?.id_entidade || null);
      } catch (error) {
        if (ativo) setErro(error.message);
      }
    }

    carregarParticipantes();
    return () => {
      ativo = false;
    };
  }, [termo]);

  useEffect(() => {
    if (!participanteId) return;
    let ativo = true;

    async function carregarDetalhe() {
      setCarregando(true);
      setErro("");
      setMensagem("");
      try {
        const [participante, lancamentos] = await Promise.all([
          buscarParticipante(participanteId),
          listarLancamentosMensais(participanteId, ano),
        ]);

        if (!ativo) return;
        const porMes = new Map(
          lancamentos.map((linha) => [Number(linha.mes), linha]),
        );
        setDetalhe(participante);
        setLinhas(
          meses.map((mes) => normalizarLinha(porMes.get(mes.valor), mes.valor)),
        );
        setAlterado(false);
      } catch (error) {
        if (ativo) setErro(error.message);
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarDetalhe();
    return () => {
      ativo = false;
    };
  }, [participanteId, ano]);

  useEffect(() => {
    let ativo = true;

    async function carregarRelatorio() {
      try {
        const data = await buscarRelatorioMensal({
          ano,
          mes: mesRelatorio,
        });
        if (ativo) setRelatorio(data);
      } catch {
        if (ativo) setRelatorio(null);
      }
    }

    carregarRelatorio();
    return () => {
      ativo = false;
    };
  }, [ano, mesRelatorio, mensagem]);

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
  );

  function alterarLinha(mes, campo, valor) {
    setLinhas((atuais) =>
      atuais.map((linha) =>
        linha.mes === mes ? calcularLinha({ ...linha, [campo]: valor }) : linha,
      ),
    );
    setAlterado(true);
    setMensagem("");
  }

  async function salvar() {
    if (!participanteId) return;
    setSalvando(true);
    setErro("");
    try {
      const registros = await salvarLancamentosMensais(
        participanteId,
        Number(ano),
        montarPayload(linhas),
      );
      const porMes = new Map(
        registros.map((linha) => [Number(linha.mes), linha]),
      );
      setLinhas(
        meses.map((mes) => normalizarLinha(porMes.get(mes.valor), mes.valor)),
      );
      setAlterado(false);
      setMensagem("Lancamentos salvos com sucesso.");
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  async function exportar() {
    if (!participanteId || alterado) return;
    setExportando(true);
    setErro("");
    try {
      await exportarLancamentosMensais(participanteId, ano, detalhe?.nome);
    } catch (error) {
      setErro(error.message);
    } finally {
      setExportando(false);
    }
  }

  async function adicionarSalario(event) {
    event.preventDefault();
    if (!participanteId) return;

    setErro("");
    try {
      await criarRegistroSalarial(participanteId, {
        ...salarioForm,
        percentual: salarioForm.percentual || null,
      });
      const participante = await buscarParticipante(participanteId);
      setDetalhe(participante);
      setSalarioForm({
        inicio_vigencia: "",
        salario: "",
        percentual: "",
        observacao: "",
      });
      setMensagem("Registro salarial criado.");
    } catch (error) {
      setErro(error.message);
    }
  }

  async function adicionarFerias(event) {
    event.preventDefault();
    if (!participanteId) return;

    setErro("");
    try {
      await criarFerias(participanteId, {
        ...feriasForm,
        valor_abono: feriasForm.valor_abono || null,
      });
      const participante = await buscarParticipante(participanteId);
      setDetalhe(participante);
      setFeriasForm({
        periodo_aquisitivo_inicio: "",
        periodo_aquisitivo_fim: "",
        dias_totais: "",
        dias_gozados: "",
        valor_abono: "",
        periodo_inicio: "",
        periodo_fim: "",
        data_retorno: "",
      });
      setMensagem("Ferias cadastradas.");
    } catch (error) {
      setErro(error.message);
    }
  }

  async function exportarRelatorio() {
    setErro("");
    try {
      await exportarRelatorioMensal({ ano, mes: mesRelatorio });
    } catch (error) {
      setErro(error.message);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Gestao Agronegocio 4A</p>
          <h1>Folha de Pagamento</h1>
        </div>
        <div className="topbar-controls">
          <label>
            Ano
            <input
              type="number"
              min="2000"
              max="2100"
              value={ano}
              onChange={(event) => setAno(Number(event.target.value))}
            />
          </label>
          <button
            type="button"
            className="secondary-button"
            onClick={exportar}
            disabled={!participanteId || alterado || exportando}
            title={
              alterado ? "Salve antes de exportar" : "Exportar como planilha"
            }
          >
            {exportando ? "Exportando..." : "Exportar como planilha"}
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={salvar}
            disabled={!participanteId || salvando || carregando}
          >
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </header>

      {(erro || mensagem || alterado) && (
        <div className="status-row">
          {erro && <p className="status-error">{erro}</p>}
          {mensagem && <p className="status-success">{mensagem}</p>}
          {alterado && <p className="status-warning">Alteracoes pendentes.</p>}
        </div>
      )}

      <section className="workspace">
        <aside className="sidebar">
          <div className="panel-heading">
            <h2>Participantes</h2>
            <span>{participantes.length}</span>
          </div>
          <input
            className="search-input"
            placeholder="Buscar por nome ou CPF/CNPJ"
            value={termo}
            onChange={(event) => setTermo(event.target.value)}
          />
          <div className="participant-list">
            {participantes.map((participante) => (
              <button
                key={participante.id_entidade}
                type="button"
                className={
                  participante.id_entidade === participanteId
                    ? "participant active"
                    : "participant"
                }
                onClick={() => setParticipanteId(participante.id_entidade)}
              >
                <strong>{participante.nome}</strong>
                <span>{participante.cpf_cnpj}</span>
                <small>{dinheiro(participante.salario_atual)}</small>
              </button>
            ))}
            {!participantes.length && (
              <p className="empty">Nenhum participante encontrado.</p>
            )}
          </div>
        </aside>

        <section className="content">
          <section className="summary-grid">
            <div>
              <span>Participante</span>
              <strong>{detalhe?.nome || "-"}</strong>
            </div>
            <div>
              <span>Tipos</span>
              <strong>{detalhe?.tipos?.join(", ") || "-"}</strong>
            </div>
            <div>
              <span>Salario atual</span>
              <strong>{dinheiro(detalhe?.salario_atual)}</strong>
            </div>
            <div>
              <span>Total final</span>
              <strong>{dinheiro(totais.final)}</strong>
            </div>
          </section>

          <section className="table-panel">
            <div className="panel-heading">
              <h2>Lancamentos mensais</h2>
              <span>{carregando ? "Carregando" : `${ano}`}</span>
            </div>
            <div className="table-scroll">
              <table className="payroll-table">
                <thead>
                  <tr>
                    <th>Mes</th>
                    <th>Dias</th>
                    <th>Bruto</th>
                    <th>INSS</th>
                    <th>IRRF</th>
                    <th>INSS adicional</th>
                    <th>Ferias</th>
                    <th>Comissao</th>
                    <th>Liquido</th>
                    <th>Bar</th>
                    <th>Div. 1</th>
                    <th>Div. 2</th>
                    <th>Div. 3</th>
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
                          type="number"
                          min="0"
                          max="31"
                          value={linha.dias_trabalhados}
                          onChange={(event) =>
                            alterarLinha(
                              linha.mes,
                              "dias_trabalhados",
                              event.target.value,
                            )
                          }
                        />
                      </td>
                      <td>
                        <MoneyInput
                          value={linha.salario_bruto}
                          onChange={(value) =>
                            alterarLinha(linha.mes, "salario_bruto", value)
                          }
                        />
                      </td>
                      <td>
                        <MoneyInput
                          value={linha.inss}
                          onChange={(value) =>
                            alterarLinha(linha.mes, "inss", value)
                          }
                        />
                      </td>
                      <td>
                        <MoneyInput
                          value={linha.irrf}
                          onChange={(value) =>
                            alterarLinha(linha.mes, "irrf", value)
                          }
                        />
                      </td>
                      <td>
                        <MoneyInput
                          value={linha.inss_adicional}
                          onChange={(value) =>
                            alterarLinha(linha.mes, "inss_adicional", value)
                          }
                        />
                      </td>
                      <td>
                        <MoneyInput
                          value={linha.ferias}
                          onChange={(value) =>
                            alterarLinha(linha.mes, "ferias", value)
                          }
                        />
                      </td>
                      <td>
                        <MoneyInput
                          value={linha.comissao}
                          onChange={(value) =>
                            alterarLinha(linha.mes, "comissao", value)
                          }
                        />
                      </td>
                      <td className="money-cell">
                        {dinheiro(linha.salario_liquido)}
                      </td>
                      <td>
                        <MoneyInput
                          value={linha.desconto_bar}
                          onChange={(value) =>
                            alterarLinha(linha.mes, "desconto_bar", value)
                          }
                        />
                      </td>
                      <td>
                        <MoneyInput
                          value={linha.desconto_diverso_1}
                          onChange={(value) =>
                            alterarLinha(linha.mes, "desconto_diverso_1", value)
                          }
                        />
                      </td>
                      <td>
                        <MoneyInput
                          value={linha.desconto_diverso_2}
                          onChange={(value) =>
                            alterarLinha(linha.mes, "desconto_diverso_2", value)
                          }
                        />
                      </td>
                      <td>
                        <MoneyInput
                          value={linha.desconto_diverso_3}
                          onChange={(value) =>
                            alterarLinha(linha.mes, "desconto_diverso_3", value)
                          }
                        />
                      </td>
                      <td className="money-cell strong">
                        {dinheiro(linha.salario_liquido_com_desconto)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="2">Totais</td>
                    <td>{dinheiro(totais.bruto)}</td>
                    <td colSpan="5"></td>
                    <td>{dinheiro(totais.liquido)}</td>
                    <td colSpan="4"></td>
                    <td>{dinheiro(totais.final)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          <section className="lower-grid">
            <section className="panel">
              <div className="panel-heading">
                <h2>Registros salariais</h2>
                <span>{detalhe?.registros_salariais?.length || 0}</span>
              </div>
              <form className="compact-form" onSubmit={adicionarSalario}>
                <TextInput
                  label="Inicio"
                  type="date"
                  required
                  value={salarioForm.inicio_vigencia}
                  onChange={(value) =>
                    setSalarioForm((form) => ({
                      ...form,
                      inicio_vigencia: value,
                    }))
                  }
                />
                <TextInput
                  label="Salario"
                  type="number"
                  required
                  value={salarioForm.salario}
                  onChange={(value) =>
                    setSalarioForm((form) => ({ ...form, salario: value }))
                  }
                />
                <TextInput
                  label="Percentual"
                  type="number"
                  value={salarioForm.percentual}
                  onChange={(value) =>
                    setSalarioForm((form) => ({ ...form, percentual: value }))
                  }
                />
                <button type="submit" className="secondary-button">
                  Adicionar
                </button>
              </form>
              <div className="mini-list">
                {(detalhe?.registros_salariais || [])
                  .slice(0, 5)
                  .map((registro) => (
                    <div key={registro.id_registro_salarial}>
                      <strong>{dinheiro(registro.salario)}</strong>
                      <span>{registro.inicio_vigencia}</span>
                    </div>
                  ))}
              </div>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <h2>Ferias</h2>
                <span>{detalhe?.ferias?.length || 0}</span>
              </div>
              <form className="compact-form" onSubmit={adicionarFerias}>
                <TextInput
                  label="Aquisitivo inicio"
                  type="date"
                  required
                  value={feriasForm.periodo_aquisitivo_inicio}
                  onChange={(value) =>
                    setFeriasForm((form) => ({
                      ...form,
                      periodo_aquisitivo_inicio: value,
                    }))
                  }
                />
                <TextInput
                  label="Aquisitivo fim"
                  type="date"
                  required
                  value={feriasForm.periodo_aquisitivo_fim}
                  onChange={(value) =>
                    setFeriasForm((form) => ({
                      ...form,
                      periodo_aquisitivo_fim: value,
                    }))
                  }
                />
                <TextInput
                  label="Dias totais"
                  type="number"
                  required
                  value={feriasForm.dias_totais}
                  onChange={(value) =>
                    setFeriasForm((form) => ({ ...form, dias_totais: value }))
                  }
                />
                <TextInput
                  label="Dias gozados"
                  type="number"
                  value={feriasForm.dias_gozados}
                  onChange={(value) =>
                    setFeriasForm((form) => ({ ...form, dias_gozados: value }))
                  }
                />
                <button type="submit" className="secondary-button">
                  Adicionar
                </button>
              </form>
              <div className="mini-list">
                {(detalhe?.ferias || []).slice(0, 5).map((item) => (
                  <div key={item.id_ferias}>
                    <strong>
                      {item.dias_gozados}/{item.dias_totais} dias
                    </strong>
                    <span>
                      {item.periodo_aquisitivo_inicio} a{" "}
                      {item.periodo_aquisitivo_fim}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <h2>Relatorio mensal</h2>
                <button
                  type="button"
                  className="link-button"
                  onClick={exportarRelatorio}
                  disabled={!relatorio?.itens?.length}
                >
                  Exportar
                </button>
              </div>
              <label className="field">
                <span>Mes</span>
                <select
                  value={mesRelatorio}
                  onChange={(event) =>
                    setMesRelatorio(Number(event.target.value))
                  }
                >
                  {meses.map((mes) => (
                    <option key={mes.valor} value={mes.valor}>
                      {mes.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mini-list">
                <div>
                  <strong>{dinheiro(relatorio?.total)}</strong>
                  <span>{relatorio?.itens?.length || 0} lancamento(s)</span>
                </div>
                {(relatorio?.itens || []).slice(0, 4).map((item) => (
                  <div key={item.id_folha_mensal}>
                    <strong>{item.entidade?.nome}</strong>
                    <span>{dinheiro(item.salario_liquido_com_desconto)}</span>
                  </div>
                ))}
              </div>
            </section>
          </section>
        </section>
      </section>
    </main>
  );
}

export default FolhaPage;
