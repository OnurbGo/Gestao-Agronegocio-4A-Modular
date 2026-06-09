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
  Res,
  UseGuards,
} from "@nestjs/common";
import { Request, Response } from "express";
import { AuthContext } from "../../auth-client/types/auth.types";
import { EscritorioAuthGuard } from "../../auth-client/guards/escritorio-auth.guard";
import { PermissionGuard } from "../../auth-client/guards/permission.guard";
import { RequirePermission } from "../../auth-client/decorators/require-permission.decorator";
import { CurrentUser } from "../../shared/decorators/current-user.decorator";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { FolhaService } from "../services/folha.service";
import {
  AnoQueryDto,
  FeriasIdParamDto,
  FeriasDto,
  FolhaMensalDto,
  ListarFeriasQueryDto,
  ListarParticipantesQueryDto,
  ListarRegistrosSalariaisQueryDto,
  ParticipanteIdParamDto,
  PercentualSugeridoQueryDto,
  RegistroSalarialIdParamDto,
  RegistroSalarialDto,
  RelatorioMensalQueryDto,
} from "../dto/folha.dto";

function enviarPlanilha(
  res: Response,
  arquivo: { buffer: Buffer; filename: string },
) {
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", `attachment; filename="${arquivo.filename}"`);
  res.send(arquivo.buffer);
}

@ApiTags("folha")
@ApiBearerAuth("JWT")
@Controller("folha")
@UseGuards(EscritorioAuthGuard, PermissionGuard)
export class FolhaController {
  constructor(private readonly folhaService: FolhaService) {}

  @Get("participantes")
  @RequirePermission("FOLHA", "visualizar")
  listarParticipantes(@Query() query: ListarParticipantesQueryDto) {
    return this.folhaService.listarParticipantes(query);
  }

  @Get("participantes/:id")
  @RequirePermission("FOLHA", "visualizar")
  buscarParticipante(@Param() params: ParticipanteIdParamDto) {
    return this.folhaService.buscarParticipante(params.id);
  }

  @Get("participantes/:id/registros-salariais")
  @RequirePermission("FOLHA", "visualizar")
  listarRegistrosSalariais(
    @Param() params: ParticipanteIdParamDto,
    @Query() query: ListarRegistrosSalariaisQueryDto,
  ) {
    return this.folhaService.listarRegistrosSalariais(params.id, query);
  }

  @Get("participantes/:id/registros-salariais/percentual-sugerido")
  @RequirePermission("FOLHA", "visualizar")
  percentualSugerido(
    @Param() params: ParticipanteIdParamDto,
    @Query() query: PercentualSugeridoQueryDto,
  ) {
    return this.folhaService.percentualSugerido(params.id, query);
  }

  @Post("participantes/:id/registros-salariais/:registroId/impacto-edicao")
  @RequirePermission("FOLHA", "editar")
  impactoEdicaoRegistroSalarial(
    @Param() params: RegistroSalarialIdParamDto,
    @Body() body: RegistroSalarialDto,
  ) {
    return this.folhaService.impactoEdicaoRegistroSalarial(
      params.id,
      params.registroId,
      body,
    );
  }

  @Get("participantes/:id/registros-salariais/:registroId/impacto-exclusao")
  @RequirePermission("FOLHA", "excluir")
  impactoExclusaoRegistroSalarial(
    @Param() params: RegistroSalarialIdParamDto,
  ) {
    return this.folhaService.impactoExclusaoRegistroSalarial(
      params.id,
      params.registroId,
    );
  }

  @Post("participantes/:id/registros-salariais")
  @RequirePermission("FOLHA", "criar")
  criarRegistroSalarial(
    @Param() params: ParticipanteIdParamDto,
    @Body() body: RegistroSalarialDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.folhaService.criarRegistroSalarial(
      params.id,
      body,
      usuario,
      request.ip,
    );
  }

  @Put("participantes/:id/registros-salariais/:registroId")
  @RequirePermission("FOLHA", "editar")
  atualizarRegistroSalarial(
    @Param() params: RegistroSalarialIdParamDto,
    @Body() body: RegistroSalarialDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.folhaService.atualizarRegistroSalarial(
      params.id,
      params.registroId,
      body,
      usuario,
      request.ip,
    );
  }

  @Delete("participantes/:id/registros-salariais/:registroId")
  @RequirePermission("FOLHA", "excluir")
  removerRegistroSalarial(
    @Param() params: RegistroSalarialIdParamDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.folhaService.removerRegistroSalarial(
      params.id,
      params.registroId,
      usuario,
      request.ip,
    );
  }

  @Get("participantes/:id/ferias")
  @RequirePermission("FOLHA", "visualizar")
  listarFerias(
    @Param() params: ParticipanteIdParamDto,
    @Query() query: ListarFeriasQueryDto,
  ) {
    return this.folhaService.listarFerias(params.id, query);
  }

  @Post("participantes/:id/ferias")
  @RequirePermission("FOLHA", "criar")
  criarFerias(
    @Param() params: ParticipanteIdParamDto,
    @Body() body: FeriasDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.folhaService.criarFerias(params.id, body, usuario, request.ip);
  }

  @Put("participantes/:id/ferias/:feriasId")
  @RequirePermission("FOLHA", "editar")
  atualizarFerias(
    @Param() params: FeriasIdParamDto,
    @Body() body: FeriasDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.folhaService.atualizarFerias(
      params.id,
      params.feriasId,
      body,
      usuario,
      request.ip,
    );
  }

  @Delete("participantes/:id/ferias/:feriasId")
  @RequirePermission("FOLHA", "excluir")
  removerFerias(
    @Param() params: FeriasIdParamDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.folhaService.removerFerias(
      params.id,
      params.feriasId,
      usuario,
      request.ip,
    );
  }

  @Get("participantes/:id/lancamentos-mensais")
  @RequirePermission("FOLHA", "visualizar")
  listarLancamentosMensais(
    @Param() params: ParticipanteIdParamDto,
    @Query() query: AnoQueryDto,
  ) {
    return this.folhaService.listarLancamentosMensais(params.id, query.ano);
  }

  @Put("participantes/:id/lancamentos-mensais")
  @RequirePermission("FOLHA", "editar")
  salvarLancamentosMensais(
    @Param() params: ParticipanteIdParamDto,
    @Body() body: FolhaMensalDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.folhaService.salvarLancamentosMensais(
      params.id,
      body,
      usuario,
      request.ip,
    );
  }

  @Get("participantes/:id/lancamentos-mensais/exportar")
  @RequirePermission("FOLHA", "visualizar")
  async exportarLancamentosMensais(
    @Param() params: ParticipanteIdParamDto,
    @Query() query: AnoQueryDto,
    @Res() res: Response,
  ) {
    enviarPlanilha(
      res,
      await this.folhaService.gerarPlanilhaParticipante(params.id, query.ano),
    );
  }

  @Get("relatorios/mensal")
  @RequirePermission("FOLHA", "visualizar")
  relatorioMensal(@Query() query: RelatorioMensalQueryDto) {
    return this.folhaService.relatorioMensal(query.ano, query.mes);
  }

  @Get("relatorios/mensal/exportar")
  @RequirePermission("FOLHA", "visualizar")
  async exportarRelatorioMensal(
    @Query() query: RelatorioMensalQueryDto,
    @Res() res: Response,
  ) {
    enviarPlanilha(
      res,
      await this.folhaService.gerarPlanilhaRelatorioMensal(query.ano, query.mes),
    );
  }
}

