import {
  Body,
  Controller,
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
import { AuthContext } from "../auth-client/auth.types";
import { EscritorioAuthGuard } from "../auth-client/escritorio-auth.guard";
import { PermissionGuard } from "../auth-client/permission.guard";
import { RequirePermission } from "../auth-client/require-permission.decorator";
import { CurrentUser } from "../shared/current-user.decorator";
import { ZodValidationPipe } from "../shared/zod-validation.pipe";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { FolhaService } from "./folha.service";
import {
  anoQuerySchema,
  feriasSchema,
  folhaMensalSchema,
  listarParticipantesQuerySchema,
  participanteIdParamSchema,
  registroSalarialSchema,
  relatorioMensalQuerySchema,
} from "./folha.schema";

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
  listarParticipantes(
    @Query(new ZodValidationPipe(listarParticipantesQuerySchema)) query: never,
  ) {
    return this.folhaService.listarParticipantes(query);
  }

  @Get("participantes/:id")
  @RequirePermission("FOLHA", "visualizar")
  buscarParticipante(
    @Param(new ZodValidationPipe(participanteIdParamSchema)) params: { id: number },
  ) {
    return this.folhaService.buscarParticipante(params.id);
  }

  @Get("participantes/:id/registros-salariais")
  @RequirePermission("FOLHA", "visualizar")
  listarRegistrosSalariais(
    @Param(new ZodValidationPipe(participanteIdParamSchema)) params: { id: number },
  ) {
    return this.folhaService.listarRegistrosSalariais(params.id);
  }

  @Post("participantes/:id/registros-salariais")
  @RequirePermission("FOLHA", "criar")
  criarRegistroSalarial(
    @Param(new ZodValidationPipe(participanteIdParamSchema)) params: { id: number },
    @Body(new ZodValidationPipe(registroSalarialSchema)) body: never,
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

  @Get("participantes/:id/ferias")
  @RequirePermission("FOLHA", "visualizar")
  listarFerias(
    @Param(new ZodValidationPipe(participanteIdParamSchema)) params: { id: number },
  ) {
    return this.folhaService.listarFerias(params.id);
  }

  @Post("participantes/:id/ferias")
  @RequirePermission("FOLHA", "criar")
  criarFerias(
    @Param(new ZodValidationPipe(participanteIdParamSchema)) params: { id: number },
    @Body(new ZodValidationPipe(feriasSchema)) body: never,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.folhaService.criarFerias(params.id, body, usuario, request.ip);
  }

  @Get("participantes/:id/lancamentos-mensais")
  @RequirePermission("FOLHA", "visualizar")
  listarLancamentosMensais(
    @Param(new ZodValidationPipe(participanteIdParamSchema)) params: { id: number },
    @Query(new ZodValidationPipe(anoQuerySchema)) query: { ano: number },
  ) {
    return this.folhaService.listarLancamentosMensais(params.id, query.ano);
  }

  @Put("participantes/:id/lancamentos-mensais")
  @RequirePermission("FOLHA", "editar")
  salvarLancamentosMensais(
    @Param(new ZodValidationPipe(participanteIdParamSchema)) params: { id: number },
    @Body(new ZodValidationPipe(folhaMensalSchema)) body: never,
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
    @Param(new ZodValidationPipe(participanteIdParamSchema)) params: { id: number },
    @Query(new ZodValidationPipe(anoQuerySchema)) query: { ano: number },
    @Res() res: Response,
  ) {
    enviarPlanilha(
      res,
      await this.folhaService.gerarPlanilhaParticipante(params.id, query.ano),
    );
  }

  @Get("relatorios/mensal")
  @RequirePermission("FOLHA", "visualizar")
  relatorioMensal(
    @Query(new ZodValidationPipe(relatorioMensalQuerySchema))
    query: { ano: number; mes: number },
  ) {
    return this.folhaService.relatorioMensal(query.ano, query.mes);
  }

  @Get("relatorios/mensal/exportar")
  @RequirePermission("FOLHA", "visualizar")
  async exportarRelatorioMensal(
    @Query(new ZodValidationPipe(relatorioMensalQuerySchema))
    query: { ano: number; mes: number },
    @Res() res: Response,
  ) {
    enviarPlanilha(
      res,
      await this.folhaService.gerarPlanilhaRelatorioMensal(query.ano, query.mes),
    );
  }
}
