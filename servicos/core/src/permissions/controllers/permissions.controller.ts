import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CoreAuthGuard } from "../../auth/guards/core-auth.guard";
import { AuthContext } from "../../auth/types/auth.types";
import { CurrentUser } from "../../shared/decorators/current-user.decorator";
import { PermissionsService } from "../services/permissions.service";
import { ContaIdParamDto, SalvarPermissoesDto } from "../dto/permissions.dto";

@ApiTags("permissoes")
@ApiBearerAuth("JWT")
@Controller("permissoes")
@UseGuards(CoreAuthGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get(":contaId")
  listar(
    @Param() params: ContaIdParamDto,
    @CurrentUser() usuario: AuthContext,
  ) {
    return this.permissionsService.listar(params.contaId, usuario);
  }

  @Put(":contaId")
  salvar(
    @Param() params: ContaIdParamDto,
    @Body() body: SalvarPermissoesDto,
    @CurrentUser() usuario: AuthContext,
  ) {
    return this.permissionsService.salvar(params.contaId, body, usuario);
  }
}

