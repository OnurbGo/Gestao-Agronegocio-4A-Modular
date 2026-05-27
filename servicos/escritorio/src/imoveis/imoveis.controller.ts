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
import { AuthContext } from "../auth-client/auth.types";
import { EscritorioAuthGuard } from "../auth-client/escritorio-auth.guard";
import { PermissionGuard } from "../auth-client/permission.guard";
import { RequirePermission } from "../auth-client/require-permission.decorator";
import { CurrentUser } from "../shared/current-user.decorator";
import { ZodValidationPipe } from "../shared/zod-validation.pipe";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  atualizarImovelSchema,
  imovelIdParamSchema,
  imovelSchema,
  listarImoveisQuerySchema,
} from "./imoveis.schema";
import { ImoveisService } from "./imoveis.service";

@ApiTags("imoveis")
@ApiBearerAuth("JWT")
@Controller("imoveis")
@UseGuards(EscritorioAuthGuard, PermissionGuard)
export class ImoveisController {
  constructor(private readonly imoveisService: ImoveisService) {}

  @Get()
  @RequirePermission("ESCRITORIO", "visualizar")
  listar(@Query(new ZodValidationPipe(listarImoveisQuerySchema)) query: never) {
    return this.imoveisService.listar(query);
  }

  @Post()
  @RequirePermission("ESCRITORIO", "criar")
  criar(
    @Body(new ZodValidationPipe(imovelSchema)) body: never,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.imoveisService.criar(body, usuario, request.ip);
  }

  @Get(":id")
  @RequirePermission("ESCRITORIO", "visualizar")
  buscarPorId(@Param(new ZodValidationPipe(imovelIdParamSchema)) params: { id: number }) {
    return this.imoveisService.buscarPorId(params.id);
  }

  @Put(":id")
  @RequirePermission("ESCRITORIO", "editar")
  atualizar(
    @Param(new ZodValidationPipe(imovelIdParamSchema)) params: { id: number },
    @Body(new ZodValidationPipe(atualizarImovelSchema)) body: never,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.imoveisService.atualizar(params.id, body, usuario, request.ip);
  }

  @Delete(":id")
  @RequirePermission("ESCRITORIO", "excluir")
  remover(
    @Param(new ZodValidationPipe(imovelIdParamSchema)) params: { id: number },
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.imoveisService.remover(params.id, usuario, request.ip);
  }
}
