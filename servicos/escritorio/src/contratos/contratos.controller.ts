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
  UsePipes,
} from "@nestjs/common";
import { Request } from "express";
import { AuthContext } from "../auth-client/auth.types";
import { EscritorioAuthGuard } from "../auth-client/escritorio-auth.guard";
import { PermissionGuard } from "../auth-client/permission.guard";
import { RequirePermission } from "../auth-client/require-permission.decorator";
import { CurrentUser } from "../shared/current-user.decorator";
import { ZodValidationPipe } from "../shared/zod-validation.pipe";
import {
  atualizarContratoSchema,
  contratoIdParamSchema,
  contratoSchema,
  listarContratosQuerySchema,
} from "./contratos.schema";
import { ContratosService } from "./contratos.service";

@Controller("contratos")
@UseGuards(EscritorioAuthGuard, PermissionGuard)
export class ContratosController {
  constructor(private readonly contratosService: ContratosService) {}

  @Get()
  @RequirePermission("ESCRITORIO", "visualizar")
  listar(@Query(new ZodValidationPipe(listarContratosQuerySchema)) query: never) {
    return this.contratosService.listar(query);
  }

  @Post()
  @RequirePermission("ESCRITORIO", "criar")
  @UsePipes(new ZodValidationPipe(contratoSchema))
  criar(
    @Body() body: never,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.contratosService.criar(body, usuario, request.ip);
  }

  @Get(":id")
  @RequirePermission("ESCRITORIO", "visualizar")
  buscarPorId(
    @Param(new ZodValidationPipe(contratoIdParamSchema)) params: { id: number },
  ) {
    return this.contratosService.buscarPorId(params.id);
  }

  @Put(":id")
  @RequirePermission("ESCRITORIO", "editar")
  @UsePipes(new ZodValidationPipe(atualizarContratoSchema))
  atualizar(
    @Param(new ZodValidationPipe(contratoIdParamSchema)) params: { id: number },
    @Body() body: never,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.contratosService.atualizar(params.id, body, usuario, request.ip);
  }

  @Delete(":id")
  @RequirePermission("ESCRITORIO", "excluir")
  remover(
    @Param(new ZodValidationPipe(contratoIdParamSchema)) params: { id: number },
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.contratosService.remover(params.id, usuario, request.ip);
  }
}
