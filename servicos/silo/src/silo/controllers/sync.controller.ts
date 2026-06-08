import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Request } from "express";
import {
  RequireAnyPermission,
  RequirePermission,
} from "../../auth-client/decorators/require-permission.decorator";
import { PermissionGuard } from "../../auth-client/guards/permission.guard";
import { SiloAuthGuard } from "../../auth-client/guards/silo-auth.guard";
import { AuthContext } from "../../auth-client/types/auth.types";
import { CurrentUser } from "../../shared/decorators/current-user.decorator";
import { SincronizarPesagemDto } from "../dto/sync.dto";
import { SyncService } from "../services/sync.service";

@ApiTags("silo-sync")
@ApiBearerAuth("JWT")
@Controller("sync")
@UseGuards(SiloAuthGuard, PermissionGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post("pesagens")
  @RequirePermission("BALANCA", "criar")
  @ApiOperation({ summary: "Sincroniza pesagem criada offline no app desktop" })
  @ApiBody({
    type: SincronizarPesagemDto,
    examples: {
      offline: {
        value: {
          client_request_id: "9df79394-29ef-4f77-8e5a-6ea3c70de639",
          balanca_client_id: "BALANCA_01",
          origem: "DESKTOP_OFFLINE",
          romaneio_range_id: 1,
          serie_romaneio_id: 1,
          numero_romaneio: 1500,
          tipo_operacao: "ENTRADA",
          lote_operacional_id: 1,
          conta_produto_id: 1,
          item_id: 1,
          transportadora_id: 1,
          emissor_id: 1,
          deposito_id: 1,
          destino_id: 1,
          contrato_id: null,
          placa: "ABC1234",
          motorista_nome: "Joao",
          observacao: null,
          pesagem_1_kg: 30000,
          pesagem_2_kg: 12000,
          umidade_percentual: 14,
          impureza_percentual: 2,
          created_at_local: "2026-06-08T10:00:00.000Z",
          finalizar: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Pesagem sincronizada ou ja sincronizada.",
    schema: {
      example: {
        status: "SINCRONIZADO",
        pesagem_id: 10,
        numero_romaneio: 1500,
        serie_romaneio_id: 1,
        movimentacao_id: 5,
      },
    },
  })
  sincronizarPesagem(
    @Body() body: SincronizarPesagemDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.syncService.sincronizarPesagem(body, usuario, request.ip);
  }

  @Get("bootstrap")
  @RequireAnyPermission([
    { modulo: "BALANCA", acao: "visualizar" },
    { modulo: "SILO", acao: "visualizar" },
  ])
  @ApiOperation({ summary: "Retorna dados essenciais para operacao offline" })
  bootstrap(@CurrentUser() usuario: AuthContext) {
    return this.syncService.bootstrap(usuario);
  }

  @Get("status")
  @RequireAnyPermission([
    { modulo: "BALANCA", acao: "visualizar" },
    { modulo: "SILO", acao: "visualizar" },
  ])
  @ApiOperation({ summary: "Retorna diagnostico basico da API para o app desktop" })
  status(@CurrentUser() usuario: AuthContext) {
    return this.syncService.status(usuario);
  }
}
