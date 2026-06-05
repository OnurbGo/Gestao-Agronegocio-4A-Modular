import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import {
  CountOptions,
  FindAndCountOptions,
  FindOptions,
  Op,
  Transaction,
  TransactionOptions,
  UpdateOptions,
  WhereOptions,
} from "sequelize";
import { ClassificacaoPesagem } from "../entities/classificacao-pesagem.entity";
import { ContaProduto } from "../entities/conta-produto.entity";
import { Contrato } from "../entities/contrato.entity";
import { DadosSaidaPesagem } from "../entities/dados-saida-pesagem.entity";
import { Deposito } from "../entities/deposito.entity";
import { Destino } from "../entities/destino.entity";
import { Emissor } from "../entities/emissor.entity";
import { FaixaDesconto } from "../entities/faixa-desconto.entity";
import { Item } from "../entities/item.entity";
import { LoteOperacional } from "../entities/lote-operacional.entity";
import { MovimentacaoProduto } from "../entities/movimentacao-produto.entity";
import { Pesagem } from "../entities/pesagem.entity";
import { SaldoContaProduto } from "../entities/saldo-conta-produto.entity";
import { SaldoDeposito } from "../entities/saldo-deposito.entity";
import { SerieRomaneio } from "../entities/serie-romaneio.entity";
import { TabelaDesconto } from "../entities/tabela-desconto.entity";
import { Transportadora } from "../entities/transportadora.entity";

@Injectable()
export class SiloRepository {
  constructor(
    @InjectModel(ContaProduto)
    private readonly contaProdutoModel: typeof ContaProduto,
    @InjectModel(Item) private readonly itemModel: typeof Item,
    @InjectModel(Transportadora)
    private readonly transportadoraModel: typeof Transportadora,
    @InjectModel(Emissor) private readonly emissorModel: typeof Emissor,
    @InjectModel(Deposito) private readonly depositoModel: typeof Deposito,
    @InjectModel(Destino) private readonly destinoModel: typeof Destino,
    @InjectModel(SerieRomaneio)
    private readonly serieRomaneioModel: typeof SerieRomaneio,
    @InjectModel(LoteOperacional)
    private readonly loteOperacionalModel: typeof LoteOperacional,
    @InjectModel(Pesagem) private readonly pesagemModel: typeof Pesagem,
    @InjectModel(TabelaDesconto)
    private readonly tabelaDescontoModel: typeof TabelaDesconto,
    @InjectModel(FaixaDesconto)
    private readonly faixaDescontoModel: typeof FaixaDesconto,
    @InjectModel(ClassificacaoPesagem)
    private readonly classificacaoModel: typeof ClassificacaoPesagem,
    @InjectModel(Contrato) private readonly contratoModel: typeof Contrato,
    @InjectModel(DadosSaidaPesagem)
    private readonly dadosSaidaModel: typeof DadosSaidaPesagem,
    @InjectModel(MovimentacaoProduto)
    private readonly movimentacaoModel: typeof MovimentacaoProduto,
    @InjectModel(SaldoContaProduto)
    private readonly saldoContaModel: typeof SaldoContaProduto,
    @InjectModel(SaldoDeposito)
    private readonly saldoDepositoModel: typeof SaldoDeposito,
  ) {}

  criarTransacao(options?: TransactionOptions) {
    return this.contaProdutoModel.sequelize!.transaction(options);
  }

  listarContasProduto(options: FindAndCountOptions) {
    return this.contaProdutoModel.findAndCountAll(options);
  }

  buscarContaProduto(id: number, transaction?: Transaction) {
    return this.contaProdutoModel.findByPk(id, { transaction });
  }

  criarContaProduto(data: Record<string, unknown>, transaction?: Transaction) {
    return this.contaProdutoModel.create(data, { transaction });
  }

  listarItens(options: FindAndCountOptions) {
    return this.itemModel.findAndCountAll(options);
  }

  buscarItem(id: number, transaction?: Transaction) {
    return this.itemModel.findByPk(id, { transaction });
  }

  criarItem(data: Record<string, unknown>, transaction?: Transaction) {
    return this.itemModel.create(data, { transaction });
  }

  listarTransportadoras(options: FindAndCountOptions) {
    return this.transportadoraModel.findAndCountAll(options);
  }

  buscarTransportadora(id: number, transaction?: Transaction) {
    return this.transportadoraModel.findByPk(id, { transaction });
  }

  criarTransportadora(data: Record<string, unknown>, transaction?: Transaction) {
    return this.transportadoraModel.create(data, { transaction });
  }

  listarEmissores(options: FindAndCountOptions) {
    return this.emissorModel.findAndCountAll(options);
  }

  buscarEmissor(id: number, transaction?: Transaction) {
    return this.emissorModel.findByPk(id, { transaction });
  }

  criarEmissor(data: Record<string, unknown>, transaction?: Transaction) {
    return this.emissorModel.create(data, { transaction });
  }

  listarDepositos(options: FindAndCountOptions) {
    return this.depositoModel.findAndCountAll(options);
  }

  buscarDeposito(id: number, transaction?: Transaction) {
    return this.depositoModel.findByPk(id, { transaction });
  }

  criarDeposito(data: Record<string, unknown>, transaction?: Transaction) {
    return this.depositoModel.create(data, { transaction });
  }

  listarDestinos(options: FindAndCountOptions) {
    return this.destinoModel.findAndCountAll(options);
  }

  buscarDestino(id: number, transaction?: Transaction) {
    return this.destinoModel.findByPk(id, { transaction });
  }

  criarDestino(data: Record<string, unknown>, transaction?: Transaction) {
    return this.destinoModel.create(data, { transaction });
  }

  listarSeriesRomaneio(options: FindAndCountOptions) {
    return this.serieRomaneioModel.findAndCountAll(options);
  }

  buscarSerieRomaneio(id: number, transaction?: Transaction) {
    return this.serieRomaneioModel.findByPk(id, { transaction });
  }

  buscarSerieAtiva(transaction?: Transaction) {
    return this.serieRomaneioModel.findOne({
      where: { ativa: true },
      order: [["iniciada_em", "DESC"]],
      transaction,
    });
  }

  criarSerieRomaneio(data: Record<string, unknown>, transaction?: Transaction) {
    return this.serieRomaneioModel.create(data, { transaction });
  }

  encerrarSeriesAtivas(transaction?: Transaction) {
    return this.serieRomaneioModel.update(
      { ativa: false, encerrada_em: new Date() },
      { where: { ativa: true }, transaction },
    );
  }

  listarLotes(options: FindAndCountOptions) {
    return this.loteOperacionalModel.findAndCountAll(options);
  }

  buscarLote(id: number, options: FindOptions = {}) {
    return this.loteOperacionalModel.findByPk(id, options);
  }

  criarLote(data: Record<string, unknown>, transaction?: Transaction) {
    return this.loteOperacionalModel.create(data, { transaction });
  }

  listarPesagens(options: FindAndCountOptions) {
    return this.pesagemModel.findAndCountAll(options);
  }

  buscarPesagem(id: number, options: FindOptions = {}) {
    return this.pesagemModel.findByPk(id, options);
  }

  criarPesagem(data: Record<string, unknown>, transaction?: Transaction) {
    return this.pesagemModel.create(data, { transaction });
  }

  buscarClassificacaoPorPesagem(pesagemId: number, transaction?: Transaction) {
    return this.classificacaoModel.findOne({
      where: { pesagem_id: pesagemId },
      transaction,
    });
  }

  criarClassificacao(data: Record<string, unknown>, transaction?: Transaction) {
    return this.classificacaoModel.create(data, { transaction });
  }

  listarTabelasDesconto(options: FindAndCountOptions) {
    return this.tabelaDescontoModel.findAndCountAll(options);
  }

  buscarTabelaDesconto(id: number, options: FindOptions = {}) {
    return this.tabelaDescontoModel.findByPk(id, options);
  }

  criarTabelaDesconto(data: Record<string, unknown>, transaction?: Transaction) {
    return this.tabelaDescontoModel.create(data, { transaction });
  }

  buscarTabelaAtivaPorItem(itemId: number, transaction?: Transaction) {
    return this.tabelaDescontoModel.findOne({
      where: { item_id: itemId, ativa: true },
      include: [{ model: FaixaDesconto, as: "faixas" }],
      transaction,
      order: [["id_tabela_desconto", "DESC"]],
    });
  }

  contarTabelasAtivasPorItem(
    itemId: number,
    ignorarTabelaId?: number,
    transaction?: Transaction,
  ) {
    const where: WhereOptions = { item_id: itemId, ativa: true };

    if (ignorarTabelaId) {
      Object.assign(where, { id_tabela_desconto: { [Op.ne]: ignorarTabelaId } });
    }

    return this.tabelaDescontoModel.count({ where, transaction });
  }

  listarFaixas(options: FindOptions) {
    return this.faixaDescontoModel.findAll(options);
  }

  buscarFaixa(id: number, transaction?: Transaction) {
    return this.faixaDescontoModel.findByPk(id, { transaction });
  }

  criarFaixa(data: Record<string, unknown>, transaction?: Transaction) {
    return this.faixaDescontoModel.create(data, { transaction });
  }

  listarContratos(options: FindAndCountOptions) {
    return this.contratoModel.findAndCountAll(options);
  }

  buscarContrato(id: number, options: FindOptions = {}) {
    return this.contratoModel.findByPk(id, options);
  }

  criarContrato(data: Record<string, unknown>, transaction?: Transaction) {
    return this.contratoModel.create(data, { transaction });
  }

  listarDadosSaida(options: FindAndCountOptions) {
    return this.dadosSaidaModel.findAndCountAll(options);
  }

  buscarDadosSaida(id: number, options: FindOptions = {}) {
    return this.dadosSaidaModel.findByPk(id, options);
  }

  buscarDadosSaidaPorPesagem(pesagemId: number, transaction?: Transaction) {
    return this.dadosSaidaModel.findOne({
      where: { pesagem_id: pesagemId },
      transaction,
    });
  }

  criarDadosSaida(data: Record<string, unknown>, transaction?: Transaction) {
    return this.dadosSaidaModel.create(data, { transaction });
  }

  listarMovimentacoes(options: FindAndCountOptions) {
    return this.movimentacaoModel.findAndCountAll(options);
  }

  buscarMovimentacaoPorPesagem(pesagemId: number, transaction?: Transaction) {
    return this.movimentacaoModel.findOne({
      where: { pesagem_id: pesagemId },
      transaction,
    });
  }

  criarMovimentacao(data: Record<string, unknown>, transaction?: Transaction) {
    return this.movimentacaoModel.create(data, { transaction });
  }

  buscarSaldoConta(
    contaProdutoId: number,
    itemId: number,
    transaction?: Transaction,
  ) {
    return this.saldoContaModel.findOne({
      where: { conta_produto_id: contaProdutoId, item_id: itemId },
      transaction,
    });
  }

  criarSaldoConta(data: Record<string, unknown>, transaction?: Transaction) {
    return this.saldoContaModel.create(data, { transaction });
  }

  listarSaldosConta(options: FindAndCountOptions) {
    return this.saldoContaModel.findAndCountAll(options);
  }

  buscarSaldoDeposito(
    depositoId: number,
    itemId: number,
    transaction?: Transaction,
  ) {
    return this.saldoDepositoModel.findOne({
      where: { deposito_id: depositoId, item_id: itemId },
      transaction,
    });
  }

  criarSaldoDeposito(data: Record<string, unknown>, transaction?: Transaction) {
    return this.saldoDepositoModel.create(data, { transaction });
  }

  listarSaldosDeposito(options: FindAndCountOptions) {
    return this.saldoDepositoModel.findAndCountAll(options);
  }

  contarPesagens(options: CountOptions) {
    return this.pesagemModel.count(options);
  }

  atualizarEmLotePesagens(
    data: Record<string, unknown>,
    options: UpdateOptions,
  ) {
    return this.pesagemModel.update(data, options);
  }
}
