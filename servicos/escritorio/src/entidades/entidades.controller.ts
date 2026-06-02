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
import { EscritorioAuthGuard } from "../auth-client/escritorio-auth.guard";
import { PermissionGuard } from "../auth-client/permission.guard";
import { RequirePermission } from "../auth-client/require-permission.decorator";
import { CurrentUser } from "../shared/current-user.decorator";
import { ZodValidationPipe } from "../shared/zod-validation.pipe";
import { AuthContext } from "../auth-client/auth.types";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { EntidadesService } from "./entidades.service";
import {
  atualizarEntidadeSchema,
  entidadeIdParamSchema,
  entidadeSchema,
  listarEntidadesQuerySchema,
} from "./entidades.schema";

@ApiTags("entidades")
@ApiBearerAuth("JWT")
@Controller("entidades")
@UseGuards(EscritorioAuthGuard, PermissionGuard)
export class EntidadesController {
  constructor(private readonly entidadesService: EntidadesService) {}

  @Get()
  @RequirePermission("ESCRITORIO", "visualizar")
  listar(@Query(new ZodValidationPipe(listarEntidadesQuerySchema)) query: never) {
    return this.entidadesService.listar(query);
  }

  @Post()
  @RequirePermission("ESCRITORIO", "criar")
  criar(
    @Body(new ZodValidationPipe(entidadeSchema)) body: never,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.entidadesService.criar(body, usuario, request.ip);
  }

  @Get(":id")
  @RequirePermission("ESCRITORIO", "visualizar")
  buscarPorId(@Param(new ZodValidationPipe(entidadeIdParamSchema)) params: { id: number }) {
    return this.entidadesService.buscarPorId(params.id);
  }

  @Put(":id")
  @RequirePermission("ESCRITORIO", "editar")
  atualizar(
    @Param(new ZodValidationPipe(entidadeIdParamSchema)) params: { id: number },
    @Body(new ZodValidationPipe(atualizarEntidadeSchema)) body: never,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.entidadesService.atualizar(params.id, body, usuario, request.ip);
  }

  @Delete(":id")
  @RequirePermission("ESCRITORIO", "excluir")
  remover(
    @Param(new ZodValidationPipe(entidadeIdParamSchema)) params: { id: number },
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.entidadesService.remover(params.id, usuario, request.ip);
  }
}
