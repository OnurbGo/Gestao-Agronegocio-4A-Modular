import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthContext } from "../auth/auth.types";
import { CoreAuthGuard } from "../auth/core-auth.guard";
import { CurrentUser } from "../shared/current-user.decorator";
import { ZodValidationPipe } from "../shared/zod-validation.pipe";
import { UsersService } from "./users.service";
import {
  atualizarUsuarioSchema,
  usuarioIdParamSchema,
  AtualizarUsuarioInput,
} from "./users.schema";

@ApiTags("usuarios")
@ApiBearerAuth("JWT")
@Controller("usuarios")
@UseGuards(CoreAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  listar(@CurrentUser() usuario: AuthContext) {
    return this.usersService.listar(usuario);
  }

  @Get(":id")
  buscarPorId(
    @Param(new ZodValidationPipe(usuarioIdParamSchema)) params: { id: number },
    @CurrentUser() usuario: AuthContext,
  ) {
    return this.usersService.buscarPorId(params.id, usuario);
  }

  @Patch(":id")
  atualizar(
    @Param(new ZodValidationPipe(usuarioIdParamSchema)) params: { id: number },
    @Body(new ZodValidationPipe(atualizarUsuarioSchema))
    body: AtualizarUsuarioInput,
    @CurrentUser() usuario: AuthContext,
  ) {
    return this.usersService.atualizar(params.id, body, usuario);
  }
}
