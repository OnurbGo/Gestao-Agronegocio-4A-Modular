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
import { AuthContext } from "../../auth-client/types/auth.types";
import { EscritorioAuthGuard } from "../../auth-client/guards/escritorio-auth.guard";
import { PermissionGuard } from "../../auth-client/guards/permission.guard";
import { RequirePermission } from "../../auth-client/decorators/require-permission.decorator";
import { CurrentUser } from "../../shared/decorators/current-user.decorator";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  AtualizarImovelDto,
  ImovelDto,
  ImovelIdParamDto,
  ListarImoveisQueryDto,
} from "../dto/imoveis.dto";
import { ImoveisService } from "../services/imoveis.service";

@ApiTags("imoveis")
@ApiBearerAuth("JWT")
@Controller("imoveis")
@UseGuards(EscritorioAuthGuard, PermissionGuard)
export class ImoveisController {
  constructor(private readonly imoveisService: ImoveisService) {}

  @Get()
  @RequirePermission("ESCRITORIO", "visualizar")
  listar(@Query() query: ListarImoveisQueryDto) {
    return this.imoveisService.listar(query);
  }

  @Post()
  @RequirePermission("ESCRITORIO", "criar")
  criar(
    @Body() body: ImovelDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.imoveisService.criar(body, usuario, request.ip);
  }

  @Get(":id")
  @RequirePermission("ESCRITORIO", "visualizar")
  buscarPorId(@Param() params: ImovelIdParamDto) {
    return this.imoveisService.buscarPorId(params.id);
  }

  @Put(":id")
  @RequirePermission("ESCRITORIO", "editar")
  atualizar(
    @Param() params: ImovelIdParamDto,
    @Body() body: AtualizarImovelDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.imoveisService.atualizar(params.id, body, usuario, request.ip);
  }

  @Delete(":id")
  @RequirePermission("ESCRITORIO", "excluir")
  remover(
    @Param() params: ImovelIdParamDto,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.imoveisService.remover(params.id, usuario, request.ip);
  }
}

