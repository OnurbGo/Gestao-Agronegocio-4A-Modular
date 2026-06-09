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
import { Request } from "express";
import { CoreAuthGuard } from "../../auth/guards/core-auth.guard";
import { OptionalCoreAuthGuard } from "../../auth/guards/optional-core-auth.guard";
import { AuthContext } from "../../auth/types/auth.types";
import { CurrentUser } from "../../shared/decorators/current-user.decorator";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AccountsService } from "../services/accounts.service";
import {
  AlterarSenhaContaDto,
  AlterarSenhaContaInput,
  AprovarSolicitacaoDto,
  AtualizarStatusContaInput,
  AtualizarStatusContaDto,
  AprovarSolicitacaoInput,
  ContaIdParamDto,
  CriarContaDto,
  CriarContaInput,
  ListarContasQuery,
  ListarContasQueryDto,
  ListarSolicitacoesQuery,
  ListarSolicitacoesQueryDto,
  RecusarSolicitacaoDto,
  RecusarSolicitacaoInput,
  SolicitacaoIdParamDto,
  SolicitarContaDto,
  SolicitarContaInput,
} from "../dto/accounts.dto";

@ApiTags("contas")
@ApiBearerAuth("JWT")
@Controller("contas")
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @UseGuards(CoreAuthGuard)
  listar(
    @Query() query: ListarContasQueryDto,
    @CurrentUser() usuario: AuthContext,
  ) {
    return this.accountsService.listar(query, usuario);
  }

  @Post()
  @UseGuards(OptionalCoreAuthGuard)
  criar(
    @Body() body: CriarContaDto,
    @CurrentUser() usuario: AuthContext | undefined,
    @Req() request: Request,
  ) {
    return this.accountsService.criar(body, usuario, request.ip);
  }

  @Post("solicitacoes")
  solicitar(
    @Body() body: SolicitarContaDto,
    @Req() request: Request,
  ) {
    return this.accountsService.solicitar(body, request.ip);
  }

  @Get("solicitacoes")
  @UseGuards(CoreAuthGuard)
  listarSolicitacoes(
    @Query() query: ListarSolicitacoesQueryDto,
    @CurrentUser() usuario: AuthContext,
  ) {
    return this.accountsService.listarSolicitacoes(query, usuario);
  }

  @Patch("solicitacoes/:id/aprovar")
  @UseGuards(CoreAuthGuard)
  aprovarSolicitacao(
    @Param() params: SolicitacaoIdParamDto,
    @Body() body: AprovarSolicitacaoDto,
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
  recusarSolicitacao(
    @Param() params: SolicitacaoIdParamDto,
    @Body() body: RecusarSolicitacaoDto,
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
    @Param() params: ContaIdParamDto,
    @CurrentUser() usuario: AuthContext,
  ) {
    return this.accountsService.buscarPorId(params.id, usuario);
  }

  @Patch(":id/status")
  @UseGuards(CoreAuthGuard)
  atualizarStatus(
    @Param() params: ContaIdParamDto,
    @Body() body: AtualizarStatusContaDto,
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

  @Patch(":id/senha")
  @UseGuards(CoreAuthGuard)
  alterarSenha(
    @Param() params: ContaIdParamDto,
    @Body() body: AlterarSenhaContaDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.accountsService.alterarSenha(
      params.id,
      body,
      usuario,
      request.ip,
    );
  }
}

