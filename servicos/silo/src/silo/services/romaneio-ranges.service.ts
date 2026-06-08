import { BadRequestException, Injectable } from "@nestjs/common";
import { Transaction } from "sequelize";
import { AuditService } from "../../audit/services/audit.service";
import { AuthContext } from "../../auth-client/types/auth.types";
import { ReservarFaixaRomaneioInput } from "../dto/romaneio-ranges.dto";
import { RomaneioRange } from "../entities/romaneio-range.entity";
import { SiloRepository } from "../repositories/silo.repository";

const QUANTIDADES_PADRAO = [150, 200];

@Injectable()
export class RomaneioRangesService {
  constructor(
    private readonly siloRepository: SiloRepository,
    private readonly auditService: AuditService,
  ) {}

  async reservarFaixa(
    data: ReservarFaixaRomaneioInput,
    usuario: AuthContext,
    ip?: string,
  ) {
    this.validarQuantidade(data.quantidade, usuario);

    const transaction = await this.siloRepository.criarTransacao({
      isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    });
    let range: RomaneioRange;

    try {
      const serie = await this.siloRepository.buscarSerieAtivaParaAtualizacao(
        transaction,
      );

      if (!serie) {
        throw new BadRequestException(
          "Nao existe serie de romaneio ativa. Um GERENTE ou ADMIN deve iniciar uma serie.",
        );
      }

      const numeroInicial = serie.proximo_numero;
      const numeroFinal = numeroInicial + data.quantidade - 1;

      range = await this.siloRepository.criarRomaneioRange(
        {
          balanca_client_id: data.balanca_client_id,
          serie_romaneio_id: serie.id_serie_romaneio,
          numero_inicial: numeroInicial,
          numero_final: numeroFinal,
          proximo_numero: numeroInicial,
          quantidade_reservada: data.quantidade,
          quantidade_usada: 0,
          status: "ATIVA",
          reservado_por: usuario.usuario_id,
          reservado_em: new Date(),
          expira_em: null,
          observacao: data.observacao || null,
        },
        transaction,
      );

      await serie.update(
        { proximo_numero: numeroFinal + 1 },
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    await this.auditService.registrar({
      conta_id: usuario.conta_id,
      usuario_id: usuario.usuario_id,
      acao: "ROMANEIO_RANGE_RESERVADO",
      recurso: "ROMANEIO_RANGE",
      recurso_id: range!.id_romaneio_range,
      valor_novo: this.toPlain(range!),
      justificativa: data.observacao || null,
      ip,
    });

    return this.toReservaResponse(range!);
  }

  private validarQuantidade(quantidade: number, usuario: AuthContext) {
    if (QUANTIDADES_PADRAO.includes(quantidade)) {
      return;
    }

    if (usuario.possuiAdmin || usuario.possuiGerente) {
      return;
    }

    throw new BadRequestException(
      "Quantidade de reserva deve ser 150 ou 200 para usuarios da balanca.",
    );
  }

  private toReservaResponse(range: RomaneioRange) {
    return {
      range_id: range.id_romaneio_range,
      serie_romaneio_id: range.serie_romaneio_id,
      numero_inicial: range.numero_inicial,
      numero_final: range.numero_final,
      proximo_numero: range.proximo_numero,
      quantidade_reservada: range.quantidade_reservada,
      balanca_client_id: range.balanca_client_id,
      status: range.status,
    };
  }

  private toPlain(entity: { get: (options: { plain: true }) => object }) {
    return entity.get({ plain: true });
  }
}
