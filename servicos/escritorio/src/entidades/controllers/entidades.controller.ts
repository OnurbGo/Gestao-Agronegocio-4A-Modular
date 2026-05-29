import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { EscritorioAuthGuard } from "../../auth-client/guards/escritorio-auth.guard";
import { PermissionGuard } from "../../auth-client/guards/permission.guard";
import { RequirePermission } from "../../auth-client/decorators/require-permission.decorator";
import { CurrentUser } from "../../shared/decorators/current-user.decorator";
import { AuthContext } from "../../auth-client/types/auth.types";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { EntidadesService } from "../services/entidades.service";
import {
  AtualizarEntidadeDto,
  EntidadeDto,
  EntidadeIdParamDto,
  ListarEntidadesQueryDto,
} from "../dto/entidades.dto";

@ApiTags("entidades")
@ApiBearerAuth("JWT")
@Controller("entidades")
@UseGuards(EscritorioAuthGuard, PermissionGuard)
export class EntidadesController {
  constructor(private readonly entidadesService: EntidadesService) {}

  @Get()
  @RequirePermission("ESCRITORIO", "visualizar")
  listar(@Query() query: ListarEntidadesQueryDto) {
    return this.entidadesService.listar(query);
  }

  @Post()
  @RequirePermission("ESCRITORIO", "criar")
  criar(
    @Body() body: EntidadeDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.entidadesService.criar(body, usuario, request.ip);
  }

  @Get(":id")
  @RequirePermission("ESCRITORIO", "visualizar")
  buscarPorId(@Param() params: EntidadeIdParamDto) {
    return this.entidadesService.buscarPorId(params.id);
  }

  @Put(":id")
  @RequirePermission("ESCRITORIO", "editar")
  atualizar(
    @Param() params: EntidadeIdParamDto,
    @Body() body: AtualizarEntidadeDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.entidadesService.atualizar(params.id, body, usuario, request.ip);
  }

  @Delete(":id")
  @RequirePermission("ESCRITORIO", "excluir")
  remover(
    @Param() params: EntidadeIdParamDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.entidadesService.remover(params.id, usuario, request.ip);
  }
}

