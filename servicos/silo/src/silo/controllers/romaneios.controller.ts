import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Request } from "express";
import { RequirePermission } from "../../auth-client/decorators/require-permission.decorator";
import { PermissionGuard } from "../../auth-client/guards/permission.guard";
import { SiloAuthGuard } from "../../auth-client/guards/silo-auth.guard";
import { AuthContext } from "../../auth-client/types/auth.types";
import { CurrentUser } from "../../shared/decorators/current-user.decorator";
import { ReservarFaixaRomaneioDto } from "../dto/romaneio-ranges.dto";
import { RomaneioRangesService } from "../services/romaneio-ranges.service";

@ApiTags("silo-romaneios")
@ApiBearerAuth("JWT")
@Controller("romaneios")
@UseGuards(SiloAuthGuard, PermissionGuard)
export class RomaneiosController {
  constructor(private readonly romaneioRangesService: RomaneioRangesService) {}

  @Post("reservar-faixa")
  @RequirePermission("BALANCA", "criar")
  @ApiOperation({ summary: "Reserva faixa de numeros de romaneio para balanca offline" })
  @ApiBody({
    type: ReservarFaixaRomaneioDto,
    examples: {
      padrao: {
        value: {
          balanca_client_id: "BALANCA_01",
          quantidade: 200,
          observacao: "Reserva para operacao offline",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Faixa reservada com sucesso.",
    schema: {
      example: {
        range_id: 1,
        serie_romaneio_id: 1,
        numero_inicial: 1500,
        numero_final: 1699,
        proximo_numero: 1500,
        quantidade_reservada: 200,
        balanca_client_id: "BALANCA_01",
        status: "ATIVA",
      },
    },
  })
  reservarFaixa(
    @Body() body: ReservarFaixaRomaneioDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.romaneioRangesService.reservarFaixa(
      body,
      usuario,
      request.ip,
    );
  }
}
