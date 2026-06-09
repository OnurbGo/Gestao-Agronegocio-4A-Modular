import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RequireAnyPermission } from "../auth-client/decorators/require-permission.decorator";
import { PermissionGuard } from "../auth-client/guards/permission.guard";
import { SiloAuthGuard } from "../auth-client/guards/silo-auth.guard";
import { IdParamDto } from "../dto/common.dto";
import {
  ListarMovimentacoesQueryDto,
  ListarSaldosContaQueryDto,
  ListarSaldosDepositoQueryDto,
} from "../dto/relatorios.dto";
import { RelatoriosService } from "../services/relatorios.service";

@ApiTags("silo-relatorios")
@ApiBearerAuth("JWT")
@Controller()
@UseGuards(SiloAuthGuard, PermissionGuard)
export class RelatoriosController {
  constructor(private readonly relatoriosService: RelatoriosService) {}

  @Get("movimentacoes")
  @RequireAnyPermission([
    { modulo: "SILO", acao: "visualizar" },
    { modulo: "LANCAMENTOS_SILO", acao: "visualizar" },
  ])
  listarMovimentacoes(@Query() query: ListarMovimentacoesQueryDto) {
    return this.relatoriosService.listarMovimentacoes(query);
  }

  @Get("saldos/contas-produto")
  @RequireAnyPermission([
    { modulo: "SILO", acao: "visualizar" },
    { modulo: "LANCAMENTOS_SILO", acao: "visualizar" },
  ])
  listarSaldosConta(@Query() query: ListarSaldosContaQueryDto) {
    return this.relatoriosService.listarSaldosConta(query);
  }

  @Get("saldos/depositos")
  @RequireAnyPermission([
    { modulo: "SILO", acao: "visualizar" },
    { modulo: "LANCAMENTOS_SILO", acao: "visualizar" },
  ])
  listarSaldosDeposito(@Query() query: ListarSaldosDepositoQueryDto) {
    return this.relatoriosService.listarSaldosDeposito(query);
  }

  @Get("relatorios/entrada")
  @RequireAnyPermission([
    { modulo: "SILO", acao: "visualizar" },
    { modulo: "LANCAMENTOS_SILO", acao: "visualizar" },
  ])
  relatorioEntrada(@Query() query: ListarMovimentacoesQueryDto) {
    return this.relatoriosService.relatorioEntrada(query);
  }

  @Get("relatorios/saida")
  @RequireAnyPermission([
    { modulo: "SILO", acao: "visualizar" },
    { modulo: "LANCAMENTOS_SILO", acao: "visualizar" },
  ])
  relatorioSaida(@Query() query: ListarMovimentacoesQueryDto) {
    return this.relatoriosService.relatorioSaida(query);
  }

  @Get("relatorios/lote-operacional/:id")
  @RequireAnyPermission([
    { modulo: "SILO", acao: "visualizar" },
    { modulo: "LANCAMENTOS_SILO", acao: "visualizar" },
    { modulo: "BALANCA", acao: "visualizar" },
  ])
  relatorioLote(@Param() params: IdParamDto) {
    return this.relatoriosService.relatorioLoteOperacional(params.id);
  }
}
