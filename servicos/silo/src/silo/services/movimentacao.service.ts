import { BadRequestException, Injectable } from "@nestjs/common";
import { Transaction } from "sequelize";
import { AuthContext } from "../../auth-client/types/auth.types";
import { ClassificacaoPesagem } from "../entities/classificacao-pesagem.entity";
import { Pesagem } from "../entities/pesagem.entity";
import { TipoMovimentacao } from "../enums/silo.enums";
import { decimal, numero, sacasFromKg } from "../helpers/number.utils";
import { SiloRepository } from "../repositories/silo.repository";
import { ContratosService } from "./contratos.service";

type FinalizarMovimentacaoParams = {
  pesagem: Pesagem & { classificacao?: ClassificacaoPesagem };
  usuario: AuthContext;
  permitirSaldoNegativo: boolean;
  transaction: Transaction;
};

@Injectable()
export class MovimentacaoService {
  constructor(
    private readonly siloRepository: SiloRepository,
    private readonly contratosService: ContratosService,
  ) {}

  async gerarMovimentacaoFinalizacao(params: FinalizarMovimentacaoParams) {
    const { pesagem, usuario, permitirSaldoNegativo, transaction } = params;
    const existente = await this.siloRepository.buscarMovimentacaoPorPesagem(
      pesagem.id_pesagem,
      transaction,
    );

    if (existente) {
      throw new BadRequestException("Pesagem ja possui movimentacao de produto.");
    }

    const quantidadeKg = this.getQuantidadeMovimentadaKg(pesagem);
    const tipoMovimentacao = pesagem.tipo_operacao as TipoMovimentacao;

    if (tipoMovimentacao === "SAIDA") {
      await this.validarSaldoSaida(pesagem, quantidadeKg, permitirSaldoNegativo, transaction);
    }

    const movimentacao = await this.siloRepository.criarMovimentacao(
      {
        pesagem_id: pesagem.id_pesagem,
        lote_operacional_id: pesagem.lote_operacional_id,
        conta_produto_id: pesagem.conta_produto_id,
        item_id: pesagem.item_id,
        deposito_id: pesagem.deposito_id,
        contrato_id: pesagem.contrato_id || null,
        tipo_movimentacao: tipoMovimentacao,
        quantidade_kg: decimal(quantidadeKg),
        quantidade_sacas: decimal(sacasFromKg(quantidadeKg)),
        data_movimentacao: new Date(),
        criado_por: usuario.usuario_id,
      },
      transaction,
    );

    await this.atualizarSaldoConta(
      pesagem.conta_produto_id,
      pesagem.item_id,
      quantidadeKg,
      tipoMovimentacao,
      transaction,
    );
    await this.atualizarSaldoDeposito(
      pesagem.deposito_id,
      pesagem.item_id,
      quantidadeKg,
      tipoMovimentacao,
      transaction,
    );

    if (tipoMovimentacao === "SAIDA" && pesagem.contrato_id) {
      await this.contratosService.registrarEntrega(
        pesagem.contrato_id,
        quantidadeKg,
        usuario.usuario_id,
        transaction,
      );
    }

    return movimentacao;
  }

  private getQuantidadeMovimentadaKg(
    pesagem: Pesagem & { classificacao?: ClassificacaoPesagem },
  ) {
    const pesoFinal = pesagem.classificacao?.peso_final_kg;
    const quantidade = pesoFinal || pesagem.peso_liquido_kg;

    if (!quantidade || numero(quantidade) <= 0) {
      throw new BadRequestException("Peso liquido/final da pesagem invalido.");
    }

    return numero(quantidade);
  }

  private async validarSaldoSaida(
    pesagem: Pesagem,
    quantidadeKg: number,
    permitirSaldoNegativo: boolean,
    transaction: Transaction,
  ) {
    if (permitirSaldoNegativo) {
      return;
    }

    const [saldoConta, saldoDeposito] = await Promise.all([
      this.siloRepository.buscarSaldoConta(
        pesagem.conta_produto_id,
        pesagem.item_id,
        transaction,
      ),
      this.siloRepository.buscarSaldoDeposito(
        pesagem.deposito_id,
        pesagem.item_id,
        transaction,
      ),
    ]);

    if (!saldoConta || numero(saldoConta.saldo_kg) < quantidadeKg) {
      throw new BadRequestException(
        "Saldo insuficiente na conta de produto para finalizar a saida.",
      );
    }

    if (!saldoDeposito || numero(saldoDeposito.saldo_kg) < quantidadeKg) {
      throw new BadRequestException(
        "Saldo insuficiente no deposito para finalizar a saida.",
      );
    }
  }

  private async atualizarSaldoConta(
    contaProdutoId: number,
    itemId: number,
    quantidadeKg: number,
    tipo: TipoMovimentacao,
    transaction: Transaction,
  ) {
    const saldo = await this.siloRepository.buscarSaldoConta(
      contaProdutoId,
      itemId,
      transaction,
    );
    const delta = tipo === "ENTRADA" ? quantidadeKg : -quantidadeKg;

    if (!saldo) {
      await this.siloRepository.criarSaldoConta(
        {
          conta_produto_id: contaProdutoId,
          item_id: itemId,
          saldo_kg: decimal(delta),
          saldo_sacas: decimal(sacasFromKg(delta)),
          atualizado_em: new Date(),
        },
        transaction,
      );
      return;
    }

    const saldoKg = numero(saldo.saldo_kg) + delta;
    await saldo.update(
      {
        saldo_kg: decimal(saldoKg),
        saldo_sacas: decimal(sacasFromKg(saldoKg)),
        atualizado_em: new Date(),
      },
      { transaction },
    );
  }

  private async atualizarSaldoDeposito(
    depositoId: number,
    itemId: number,
    quantidadeKg: number,
    tipo: TipoMovimentacao,
    transaction: Transaction,
  ) {
    const saldo = await this.siloRepository.buscarSaldoDeposito(
      depositoId,
      itemId,
      transaction,
    );
    const delta = tipo === "ENTRADA" ? quantidadeKg : -quantidadeKg;

    if (!saldo) {
      await this.siloRepository.criarSaldoDeposito(
        {
          deposito_id: depositoId,
          item_id: itemId,
          saldo_kg: decimal(delta),
          saldo_sacas: decimal(sacasFromKg(delta)),
          atualizado_em: new Date(),
        },
        transaction,
      );
      return;
    }

    const saldoKg = numero(saldo.saldo_kg) + delta;
    await saldo.update(
      {
        saldo_kg: decimal(saldoKg),
        saldo_sacas: decimal(sacasFromKg(saldoKg)),
        atualizado_em: new Date(),
      },
      { transaction },
    );
  }
}
