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
import { RequirePermission } from "../auth-client/decorators/require-permission.decorator";
import { AdminOrGerenteGuard } from "../auth-client/guards/admin-or-gerente.guard";
import { PermissionGuard } from "../auth-client/guards/permission.guard";
import { SiloAuthGuard } from "../auth-client/guards/silo-auth.guard";
import { AuthContext } from "../auth-client/types/auth.types";
import { CurrentUser } from "../../shared/decorators/current-user.decorator";
import {
  AtualizarContaProdutoDto,
  AtualizarDepositoDto,
  AtualizarDestinoDto,
  AtualizarEmissorDto,
  AtualizarItemDto,
  AtualizarTransportadoraDto,
  ContaProdutoDto,
  DepositoDto,
  DestinoDto,
  EmissorDto,
  ItemDto,
  ListarCadastrosQueryDto,
  SerieRomaneioDto,
  TransportadoraDto,
} from "../dto/cadastros.dto";
import { IdParamDto } from "../dto/common.dto";
import { CadastrosService } from "../services/cadastros.service";

@ApiTags("silo-cadastros")
@ApiBearerAuth("JWT")
@Controller()
@UseGuards(SiloAuthGuard, PermissionGuard)
export class CadastrosController {
  constructor(private readonly cadastrosService: CadastrosService) {}

  @Get("contas-produto")
  @RequirePermission("SILO", "visualizar")
  listarContasProduto(@Query() query: ListarCadastrosQueryDto) {
    return this.cadastrosService.listarContasProduto(query);
  }

  @Post("contas-produto")
  @RequirePermission("SILO", "criar")
  criarContaProduto(
    @Body() body: ContaProdutoDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.cadastrosService.criarContaProduto(body, usuario, request.ip);
  }

  @Get("contas-produto/:id")
  @RequirePermission("SILO", "visualizar")
  buscarContaProduto(@Param() params: IdParamDto) {
    return this.cadastrosService.buscarContaProduto(params.id);
  }

  @Patch("contas-produto/:id")
  @RequirePermission("SILO", "editar")
  atualizarContaProduto(
    @Param() params: IdParamDto,
    @Body() body: AtualizarContaProdutoDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.cadastrosService.atualizarContaProduto(
      params.id,
      body,
      usuario,
      request.ip,
    );
  }

  @Delete("contas-produto/:id")
  @RequirePermission("SILO", "excluir")
  removerContaProduto(
    @Param() params: IdParamDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.cadastrosService.removerContaProduto(
      params.id,
      usuario,
      request.ip,
    );
  }

  @Get("itens")
  @RequirePermission("SILO", "visualizar")
  listarItens(@Query() query: ListarCadastrosQueryDto) {
    return this.cadastrosService.listarItens(query);
  }

  @Post("itens")
  @RequirePermission("SILO", "criar")
  criarItem(
    @Body() body: ItemDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.cadastrosService.criarItem(body, usuario, request.ip);
  }

  @Get("itens/:id")
  @RequirePermission("SILO", "visualizar")
  buscarItem(@Param() params: IdParamDto) {
    return this.cadastrosService.buscarItem(params.id);
  }

  @Patch("itens/:id")
  @RequirePermission("SILO", "editar")
  atualizarItem(
    @Param() params: IdParamDto,
    @Body() body: AtualizarItemDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.cadastrosService.atualizarItem(
      params.id,
      body,
      usuario,
      request.ip,
    );
  }

  @Delete("itens/:id")
  @RequirePermission("SILO", "excluir")
  removerItem(
    @Param() params: IdParamDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.cadastrosService.removerItem(params.id, usuario, request.ip);
  }

  @Get("transportadoras")
  @RequirePermission("SILO", "visualizar")
  listarTransportadoras(@Query() query: ListarCadastrosQueryDto) {
    return this.cadastrosService.listarTransportadoras(query);
  }

  @Post("transportadoras")
  @RequirePermission("SILO", "criar")
  criarTransportadora(
    @Body() body: TransportadoraDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.cadastrosService.criarTransportadora(body, usuario, request.ip);
  }

  @Get("transportadoras/:id")
  @RequirePermission("SILO", "visualizar")
  buscarTransportadora(@Param() params: IdParamDto) {
    return this.cadastrosService.buscarTransportadora(params.id);
  }

  @Patch("transportadoras/:id")
  @RequirePermission("SILO", "editar")
  atualizarTransportadora(
    @Param() params: IdParamDto,
    @Body() body: AtualizarTransportadoraDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.cadastrosService.atualizarTransportadora(
      params.id,
      body,
      usuario,
      request.ip,
    );
  }

  @Delete("transportadoras/:id")
  @RequirePermission("SILO", "excluir")
  removerTransportadora(
    @Param() params: IdParamDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.cadastrosService.removerTransportadora(
      params.id,
      usuario,
      request.ip,
    );
  }

  @Get("emissores")
  @RequirePermission("SILO", "visualizar")
  listarEmissores(@Query() query: ListarCadastrosQueryDto) {
    return this.cadastrosService.listarEmissores(query);
  }

  @Post("emissores")
  @RequirePermission("SILO", "criar")
  criarEmissor(
    @Body() body: EmissorDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.cadastrosService.criarEmissor(body, usuario, request.ip);
  }

  @Get("emissores/:id")
  @RequirePermission("SILO", "visualizar")
  buscarEmissor(@Param() params: IdParamDto) {
    return this.cadastrosService.buscarEmissor(params.id);
  }

  @Patch("emissores/:id")
  @RequirePermission("SILO", "editar")
  atualizarEmissor(
    @Param() params: IdParamDto,
    @Body() body: AtualizarEmissorDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.cadastrosService.atualizarEmissor(
      params.id,
      body,
      usuario,
      request.ip,
    );
  }

  @Delete("emissores/:id")
  @RequirePermission("SILO", "excluir")
  removerEmissor(
    @Param() params: IdParamDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.cadastrosService.removerEmissor(params.id, usuario, request.ip);
  }

  @Get("depositos")
  @RequirePermission("SILO", "visualizar")
  listarDepositos(@Query() query: ListarCadastrosQueryDto) {
    return this.cadastrosService.listarDepositos(query);
  }

  @Post("depositos")
  @RequirePermission("SILO", "criar")
  criarDeposito(
    @Body() body: DepositoDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.cadastrosService.criarDeposito(body, usuario, request.ip);
  }

  @Get("depositos/:id")
  @RequirePermission("SILO", "visualizar")
  buscarDeposito(@Param() params: IdParamDto) {
    return this.cadastrosService.buscarDeposito(params.id);
  }

  @Patch("depositos/:id")
  @RequirePermission("SILO", "editar")
  atualizarDeposito(
    @Param() params: IdParamDto,
    @Body() body: AtualizarDepositoDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.cadastrosService.atualizarDeposito(
      params.id,
      body,
      usuario,
      request.ip,
    );
  }

  @Delete("depositos/:id")
  @RequirePermission("SILO", "excluir")
  removerDeposito(
    @Param() params: IdParamDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.cadastrosService.removerDeposito(params.id, usuario, request.ip);
  }

  @Get("destinos")
  @RequirePermission("SILO", "visualizar")
  listarDestinos(@Query() query: ListarCadastrosQueryDto) {
    return this.cadastrosService.listarDestinos(query);
  }

  @Post("destinos")
  @RequirePermission("SILO", "criar")
  criarDestino(
    @Body() body: DestinoDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.cadastrosService.criarDestino(body, usuario, request.ip);
  }

  @Get("destinos/:id")
  @RequirePermission("SILO", "visualizar")
  buscarDestino(@Param() params: IdParamDto) {
    return this.cadastrosService.buscarDestino(params.id);
  }

  @Patch("destinos/:id")
  @RequirePermission("SILO", "editar")
  atualizarDestino(
    @Param() params: IdParamDto,
    @Body() body: AtualizarDestinoDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.cadastrosService.atualizarDestino(
      params.id,
      body,
      usuario,
      request.ip,
    );
  }

  @Delete("destinos/:id")
  @RequirePermission("SILO", "excluir")
  removerDestino(
    @Param() params: IdParamDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.cadastrosService.removerDestino(params.id, usuario, request.ip);
  }

  @Get("series-romaneio")
  @RequirePermission("SILO", "visualizar")
  listarSeriesRomaneio(@Query() query: ListarCadastrosQueryDto) {
    return this.cadastrosService.listarSeriesRomaneio(query);
  }

  @Post("series-romaneio")
  @UseGuards(AdminOrGerenteGuard)
  criarSerieRomaneio(
    @Body() body: SerieRomaneioDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.cadastrosService.criarNovaSerieRomaneio(
      body,
      usuario,
      request.ip,
    );
  }
}
