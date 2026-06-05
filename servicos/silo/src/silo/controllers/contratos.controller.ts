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
import { RequireAnyPermission } from "../../auth-client/decorators/require-permission.decorator";
import { AdminOrGerenteGuard } from "../../auth-client/guards/admin-or-gerente.guard";
import { PermissionGuard } from "../../auth-client/guards/permission.guard";
import { SiloAuthGuard } from "../../auth-client/guards/silo-auth.guard";
import { AuthContext } from "../../auth-client/types/auth.types";
import { CurrentUser } from "../../shared/decorators/current-user.decorator";
import { IdParamDto } from "../dto/common.dto";
import {
  AtualizarContratoDto,
  CancelarContratoDto,
  ContratoDto,
  ListarContratosQueryDto,
} from "../dto/contratos.dto";
import { ContratosService } from "../services/contratos.service";

@ApiTags("silo-contratos")
@ApiBearerAuth("JWT")
@Controller("contratos")
@UseGuards(SiloAuthGuard, PermissionGuard)
export class ContratosController {
  constructor(private readonly contratosService: ContratosService) {}

  @Get()
  @RequireAnyPermission([
    { modulo: "SILO", acao: "visualizar" },
    { modulo: "BALANCA", acao: "visualizar" },
    { modulo: "LANCAMENTOS_SILO", acao: "visualizar" },
  ])
  listar(@Query() query: ListarContratosQueryDto) {
    return this.contratosService.listar(query);
  }

  @Post()
  @UseGuards(AdminOrGerenteGuard)
  criar(
    @Body() body: ContratoDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.contratosService.criar(body, usuario, request.ip);
  }

  @Get(":id")
  @RequireAnyPermission([
    { modulo: "SILO", acao: "visualizar" },
    { modulo: "BALANCA", acao: "visualizar" },
    { modulo: "LANCAMENTOS_SILO", acao: "visualizar" },
  ])
  buscarPorId(@Param() params: IdParamDto) {
    return this.contratosService.buscarPorId(params.id);
  }

  @Patch(":id")
  @UseGuards(AdminOrGerenteGuard)
  atualizar(
    @Param() params: IdParamDto,
    @Body() body: AtualizarContratoDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.contratosService.atualizar(
      params.id,
      body,
      usuario,
      request.ip,
    );
  }

  @Post(":id/cancelar")
  @UseGuards(AdminOrGerenteGuard)
  cancelar(
    @Param() params: IdParamDto,
    @Body() body: CancelarContratoDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.contratosService.cancelar(params.id, body, usuario, request.ip);
  }
}
