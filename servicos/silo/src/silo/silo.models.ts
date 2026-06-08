import { AuditoriaSilo } from "../audit/entities/auditoria-silo.entity";
import { ClassificacaoPesagem } from "./entities/classificacao-pesagem.entity";
import { ContaProduto } from "./entities/conta-produto.entity";
import { Contrato } from "./entities/contrato.entity";
import { DadosSaidaPesagem } from "./entities/dados-saida-pesagem.entity";
import { Deposito } from "./entities/deposito.entity";
import { Destino } from "./entities/destino.entity";
import { Emissor } from "./entities/emissor.entity";
import { FaixaDesconto } from "./entities/faixa-desconto.entity";
import { Item } from "./entities/item.entity";
import { LoteOperacional } from "./entities/lote-operacional.entity";
import { MovimentacaoProduto } from "./entities/movimentacao-produto.entity";
import { Pesagem } from "./entities/pesagem.entity";
import { RomaneioRange } from "./entities/romaneio-range.entity";
import { SaldoContaProduto } from "./entities/saldo-conta-produto.entity";
import { SaldoDeposito } from "./entities/saldo-deposito.entity";
import { SerieRomaneio } from "./entities/serie-romaneio.entity";
import { TabelaDesconto } from "./entities/tabela-desconto.entity";
import { Transportadora } from "./entities/transportadora.entity";

export const SILO_MODELS = [
  ContaProduto,
  Item,
  Transportadora,
  Emissor,
  Deposito,
  Destino,
  SerieRomaneio,
  RomaneioRange,
  Contrato,
  LoteOperacional,
  Pesagem,
  TabelaDesconto,
  FaixaDesconto,
  ClassificacaoPesagem,
  DadosSaidaPesagem,
  MovimentacaoProduto,
  SaldoContaProduto,
  SaldoDeposito,
  AuditoriaSilo,
];
