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
} from "../../auth-client/decorators/require-permission.decorator";
import { AdminOrGerenteGuard } from "../../auth-client/guards/admin-or-gerente.guard";
import { PermissionGuard } from "../../auth-client/guards/permission.guard";
import { SiloAuthGuard } from "../../auth-client/guards/silo-auth.guard";
import { AuthContext } from "../../auth-client/types/auth.types";
import { CurrentUser } from "../../shared/decorators/current-user.decorator";
import { IdParamDto } from "../dto/common.dto";
import {
  AcaoLoteDto,
  AtualizarLoteOperacionalDto,
  ListarLotesOperacionaisQueryDto,
  LoteOperacionalDto,
} from "../dto/lotes-operacionais.dto";
import { LotesOperacionaisService } from "../services/lotes-operacionais.service";

@ApiTags("silo-lotes-operacionais")
@ApiBearerAuth("JWT")
@Controller("lotes-operacionais")
@UseGuards(SiloAuthGuard, PermissionGuard)
export class LotesOperacionaisController {
  constructor(private readonly lotesService: LotesOperacionaisService) {}

  @Get()
  @RequireAnyPermission([
    { modulo: "SILO", acao: "visualizar" },
    { modulo: "LANCAMENTOS_SILO", acao: "visualizar" },
    { modulo: "BALANCA", acao: "visualizar" },
  ])
  listar(@Query() query: ListarLotesOperacionaisQueryDto) {
    return this.lotesService.listar(query);
  }

  @Post()
  @RequirePermission("LANCAMENTOS_SILO", "criar")
  criar(
    @Body() body: LoteOperacionalDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.lotesService.criar(body, usuario, request.ip);
  }

  @Get(":id")
  @RequireAnyPermission([
    { modulo: "SILO", acao: "visualizar" },
    { modulo: "LANCAMENTOS_SILO", acao: "visualizar" },
    { modulo: "BALANCA", acao: "visualizar" },
  ])
  buscarPorId(@Param() params: IdParamDto) {
    return this.lotesService.buscarPorId(params.id);
  }

  @Patch(":id")
  @RequirePermission("LANCAMENTOS_SILO", "editar")
  atualizar(
    @Param() params: IdParamDto,
    @Body() body: AtualizarLoteOperacionalDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.lotesService.atualizar(params.id, body, usuario, request.ip);
  }

  @Post(":id/fechar")
  @RequirePermission("LANCAMENTOS_SILO", "editar")
  fechar(
    @Param() params: IdParamDto,
    @Body() body: AcaoLoteDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.lotesService.fechar(params.id, body, usuario, request.ip);
  }

  @Post(":id/reabrir")
  @UseGuards(AdminOrGerenteGuard)
  reabrir(
    @Param() params: IdParamDto,
    @Body() body: AcaoLoteDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.lotesService.reabrir(params.id, body, usuario, request.ip);
  }

  @Post(":id/cancelar")
  @UseGuards(AdminOrGerenteGuard)
  cancelar(
    @Param() params: IdParamDto,
    @Body() body: AcaoLoteDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.lotesService.cancelar(params.id, body, usuario, request.ip);
  }
}
