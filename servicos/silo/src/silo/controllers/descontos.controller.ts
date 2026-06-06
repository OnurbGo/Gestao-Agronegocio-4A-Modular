import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import {
  RequireAnyPermission,
  RequirePermission,
} from "../../auth-client/decorators/require-permission.decorator";
import { AdminOrGerenteGuard } from "../../auth-client/guards/admin-or-gerente.guard";
import { PermissionGuard } from "../../auth-client/guards/permission.guard";
import { SiloAuthGuard } from "../../auth-client/guards/silo-auth.guard";
import { AuthContext } from "../../auth-client/types/auth.types";
import { CurrentUser } from "../../shared/decorators/current-user.decorator";
import { IdParamDto } from "../dto/common.dto";
import {
  AtualizarFaixaDescontoDto,
  AtualizarTabelaDescontoDto,
  CalcularDescontoDto,
  FaixaDescontoDto,
  ListarTabelasDescontoQueryDto,
  TabelaDescontoDto,
} from "../dto/descontos.dto";
import { DescontosService } from "../services/descontos.service";

@ApiTags("silo-tabelas-desconto")
@ApiBearerAuth("JWT")
@Controller()
@UseGuards(SiloAuthGuard, PermissionGuard)
export class DescontosController {
  constructor(private readonly descontosService: DescontosService) {}

  @Get("tabelas-desconto")
  @RequireAnyPermission([
    { modulo: "SILO", acao: "visualizar" },
    { modulo: "CLASSIFICACAO", acao: "visualizar" },
  ])
  listar(@Query() query: ListarTabelasDescontoQueryDto) {
    return this.descontosService.listarTabelas(query);
  }

  @Post("tabelas-desconto")
  @UseGuards(AdminOrGerenteGuard)
  criar(
    @Body() body: TabelaDescontoDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.descontosService.criarTabela(body, usuario, request.ip);
  }

  @Get("tabelas-desconto/:id")
  @RequireAnyPermission([
    { modulo: "SILO", acao: "visualizar" },
    { modulo: "CLASSIFICACAO", acao: "visualizar" },
  ])
  buscar(@Param() params: IdParamDto) {
    return this.descontosService.buscarTabelaPorId(params.id);
  }

  @Patch("tabelas-desconto/:id")
  @UseGuards(AdminOrGerenteGuard)
  atualizar(
    @Param() params: IdParamDto,
    @Body() body: AtualizarTabelaDescontoDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.descontosService.atualizarTabela(
      params.id,
      body,
      usuario,
      request.ip,
    );
  }

  @Post("tabelas-desconto/:id/faixas")
  @UseGuards(AdminOrGerenteGuard)
  adicionarFaixa(
    @Param() params: IdParamDto,
    @Body() body: FaixaDescontoDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.descontosService.adicionarFaixa(
      params.id,
      body,
      usuario,
      request.ip,
    );
  }

  @Patch("faixas-desconto/:id")
  @UseGuards(AdminOrGerenteGuard)
  atualizarFaixa(
    @Param() params: IdParamDto,
    @Body() body: AtualizarFaixaDescontoDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.descontosService.atualizarFaixa(
      params.id,
      body,
      usuario,
      request.ip,
    );
  }

  @Delete("faixas-desconto/:id")
  @UseGuards(AdminOrGerenteGuard)
  desativarFaixa(
    @Param() params: IdParamDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.descontosService.desativarFaixa(params.id, usuario, request.ip);
  }

  @Post("tabelas-desconto/calcular")
  @RequirePermission("CLASSIFICACAO", "visualizar")
  calcular(@Body() body: CalcularDescontoDto) {
    return this.descontosService.calcular(body);
  }
}
