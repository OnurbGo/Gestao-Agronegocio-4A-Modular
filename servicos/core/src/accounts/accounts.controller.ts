import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import { Request } from "express";
import { CoreAuthGuard } from "../auth/core-auth.guard";
import { OptionalCoreAuthGuard } from "../auth/optional-core-auth.guard";
import { AuthContext } from "../auth/auth.types";
import { CurrentUser } from "../shared/current-user.decorator";
import { ZodValidationPipe } from "../shared/zod-validation.pipe";
import { AccountsService } from "./accounts.service";
import {
  atualizarStatusContaSchema,
  aprovarSolicitacaoSchema,
  contaIdParamSchema,
  criarContaSchema,
  recusarSolicitacaoSchema,
  solicitacaoIdParamSchema,
  solicitarContaSchema,
} from "./accounts.schema";

@Controller("contas")
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @UseGuards(CoreAuthGuard)
  listar(@CurrentUser() usuario: AuthContext) {
    return this.accountsService.listar(usuario);
  }

  @Post()
  @UseGuards(OptionalCoreAuthGuard)
  @UsePipes(new ZodValidationPipe(criarContaSchema))
  criar(
    @Body() body: never,
    @CurrentUser() usuario: AuthContext | undefined,
    @Req() request: Request,
  ) {
    return this.accountsService.criar(body, usuario, request.ip);
  }

  @Post("solicitacoes")
  @UsePipes(new ZodValidationPipe(solicitarContaSchema))
  solicitar(@Body() body: never, @Req() request: Request) {
    return this.accountsService.solicitar(body, request.ip);
  }

  @Get("solicitacoes")
  @UseGuards(CoreAuthGuard)
  listarSolicitacoes(@CurrentUser() usuario: AuthContext) {
    return this.accountsService.listarSolicitacoes(usuario);
  }

  @Patch("solicitacoes/:id/aprovar")
  @UseGuards(CoreAuthGuard)
  @UsePipes(new ZodValidationPipe(aprovarSolicitacaoSchema))
  aprovarSolicitacao(
    @Param(new ZodValidationPipe(solicitacaoIdParamSchema))
    params: { id: number },
    @Body() body: never,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.accountsService.aprovarSolicitacao(
      params.id,
      body,
      usuario,
      request.ip,
    );
  }

  @Patch("solicitacoes/:id/recusar")
  @UseGuards(CoreAuthGuard)
  @UsePipes(new ZodValidationPipe(recusarSolicitacaoSchema))
  recusarSolicitacao(
    @Param(new ZodValidationPipe(solicitacaoIdParamSchema))
    params: { id: number },
    @Body() body: never,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.accountsService.recusarSolicitacao(
      params.id,
      body,
      usuario,
      request.ip,
    );
  }

  @Get(":id")
  @UseGuards(CoreAuthGuard)
  buscarPorId(
    @Param(new ZodValidationPipe(contaIdParamSchema)) params: { id: number },
    @CurrentUser() usuario: AuthContext,
  ) {
    return this.accountsService.buscarPorId(params.id, usuario);
  }

  @Patch(":id/status")
  @UseGuards(CoreAuthGuard)
  @UsePipes(new ZodValidationPipe(atualizarStatusContaSchema))
  atualizarStatus(
    @Param(new ZodValidationPipe(contaIdParamSchema)) params: { id: number },
    @Body() body: never,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.accountsService.atualizarStatus(
      params.id,
      body,
      usuario,
      request.ip,
    );
  }
}
