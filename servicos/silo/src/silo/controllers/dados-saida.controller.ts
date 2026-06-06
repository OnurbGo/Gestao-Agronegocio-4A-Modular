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
import { RequirePermission } from "../../auth-client/decorators/require-permission.decorator";
import { PermissionGuard } from "../../auth-client/guards/permission.guard";
import { SiloAuthGuard } from "../../auth-client/guards/silo-auth.guard";
import { AuthContext } from "../../auth-client/types/auth.types";
import { CurrentUser } from "../../shared/decorators/current-user.decorator";
import { DadosSaidaPesagemDto, ListarDadosSaidaQueryDto } from "../dto/dados-saida.dto";
import { IdParamDto } from "../dto/common.dto";
import { DadosSaidaService } from "../services/dados-saida.service";

@ApiTags("silo-dados-saida")
@ApiBearerAuth("JWT")
@Controller()
@UseGuards(SiloAuthGuard, PermissionGuard)
export class DadosSaidaController {
  constructor(private readonly dadosSaidaService: DadosSaidaService) {}

  @Get("dados-saida-pesagem")
  @RequirePermission("LANCAMENTOS_SILO", "visualizar")
  listar(@Query() query: ListarDadosSaidaQueryDto) {
    return this.dadosSaidaService.listar(query);
  }

  @Post("pesagens/:id/dados-saida")
  @RequirePermission("LANCAMENTOS_SILO", "criar")
  salvarPorPesagem(
    @Param() params: IdParamDto,
    @Body() body: DadosSaidaPesagemDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.dadosSaidaService.salvarPorPesagem(
      params.id,
      body,
      usuario,
      request.ip,
    );
  }

  @Patch("dados-saida-pesagem/:id")
  @RequirePermission("LANCAMENTOS_SILO", "editar")
  atualizar(
    @Param() params: IdParamDto,
    @Body() body: DadosSaidaPesagemDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.dadosSaidaService.atualizar(params.id, body, usuario, request.ip);
  }
}
