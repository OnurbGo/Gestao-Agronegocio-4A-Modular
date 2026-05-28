import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CoreAuthGuard } from "../auth/core-auth.guard";
import { AuthContext } from "../auth/auth.types";
import { CurrentUser } from "../shared/current-user.decorator";
import { ZodValidationPipe } from "../shared/zod-validation.pipe";
import { PermissionsService } from "./permissions.service";
import { contaIdParamSchema, salvarPermissoesSchema } from "./permissions.schema";

@ApiTags("permissoes")
@ApiBearerAuth("JWT")
@Controller("permissoes")
@UseGuards(CoreAuthGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get(":contaId")
  listar(
    @Param(new ZodValidationPipe(contaIdParamSchema))
    params: { contaId: number },
    @CurrentUser() usuario: AuthContext,
  ) {
    return this.permissionsService.listar(params.contaId, usuario);
  }

  @Put(":contaId")
  salvar(
    @Param(new ZodValidationPipe(contaIdParamSchema))
    params: { contaId: number },
    @Body(new ZodValidationPipe(salvarPermissoesSchema)) body: never,
    @CurrentUser() usuario: AuthContext,
  ) {
    return this.permissionsService.salvar(params.contaId, body, usuario);
  }
}
