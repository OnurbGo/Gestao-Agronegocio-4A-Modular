import {
  Body,
  Controller,
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
} from "../auth-client/decorators/require-permission.decorator";
import { AdminOrGerenteGuard } from "../auth-client/guards/admin-or-gerente.guard";
import { PermissionGuard } from "../auth-client/guards/permission.guard";
import { SiloAuthGuard } from "../auth-client/guards/silo-auth.guard";
import { AuthContext } from "../auth-client/types/auth.types";
import { CurrentUser } from "../../shared/decorators/current-user.decorator";
import { IdParamDto } from "../dto/common.dto";
import {
  AtualizarPesagemDto,
  CancelarPesagemDto,
  ClassificarPesagemDto,
  FinalizarPesagemDto,
  ListarPesagensQueryDto,
  PesagemDto,
  RegistrarPesagemDto,
} from "../dto/pesagens.dto";
import { PesagensService } from "../services/pesagens.service";

@ApiTags("silo-pesagens")
@ApiBearerAuth("JWT")
@Controller("pesagens")
@UseGuards(SiloAuthGuard, PermissionGuard)
export class PesagensController {
  constructor(private readonly pesagensService: PesagensService) {}

  @Get()
  @RequireAnyPermission([
    { modulo: "SILO", acao: "visualizar" },
    { modulo: "BALANCA", acao: "visualizar" },
    { modulo: "CLASSIFICACAO", acao: "visualizar" },
    { modulo: "LANCAMENTOS_SILO", acao: "visualizar" },
  ])
  listar(@Query() query: ListarPesagensQueryDto) {
    return this.pesagensService.listar(query);
  }

  @Post()
  @RequirePermission("BALANCA", "criar")
  criar(
    @Body() body: PesagemDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.pesagensService.criar(body, usuario, request.ip);
  }

  @Get(":id")
  @RequireAnyPermission([
    { modulo: "SILO", acao: "visualizar" },
    { modulo: "BALANCA", acao: "visualizar" },
    { modulo: "CLASSIFICACAO", acao: "visualizar" },
    { modulo: "LANCAMENTOS_SILO", acao: "visualizar" },
  ])
  buscarPorId(@Param() params: IdParamDto) {
    return this.pesagensService.buscarPorId(params.id);
  }

  @Patch(":id")
  @RequirePermission("BALANCA", "editar")
  atualizar(
    @Param() params: IdParamDto,
    @Body() body: AtualizarPesagemDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.pesagensService.atualizar(params.id, body, usuario, request.ip);
  }

  @Post(":id/registrar-pesagem-1")
  @RequirePermission("BALANCA", "editar")
  registrarPesagem1(
    @Param() params: IdParamDto,
    @Body() body: RegistrarPesagemDto,
    @CurrentUser() usuario: AuthContext,
  ) {
    return this.pesagensService.registrarPesagem1(params.id, body, usuario);
  }

  @Post(":id/registrar-pesagem-2")
  @RequirePermission("BALANCA", "editar")
  registrarPesagem2(
    @Param() params: IdParamDto,
    @Body() body: RegistrarPesagemDto,
    @CurrentUser() usuario: AuthContext,
  ) {
    return this.pesagensService.registrarPesagem2(params.id, body, usuario);
  }

  @Post(":id/classificar")
  @RequirePermission("CLASSIFICACAO", "editar")
  classificar(
    @Param() params: IdParamDto,
    @Body() body: ClassificarPesagemDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.pesagensService.classificar(params.id, body, usuario, request.ip);
  }

  @Post(":id/finalizar")
  @RequireAnyPermission([
    { modulo: "BALANCA", acao: "editar" },
    { modulo: "LANCAMENTOS_SILO", acao: "editar" },
  ])
  finalizar(
    @Param() params: IdParamDto,
    @Body() body: FinalizarPesagemDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.pesagensService.finalizar(params.id, body, usuario, request.ip);
  }

  @Post(":id/cancelar")
  @UseGuards(AdminOrGerenteGuard)
  cancelar(
    @Param() params: IdParamDto,
    @Body() body: CancelarPesagemDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.pesagensService.cancelar(params.id, body, usuario, request.ip);
  }
}
