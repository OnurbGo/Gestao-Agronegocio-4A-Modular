import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthContext } from "../../auth/types/auth.types";
import { CoreAuthGuard } from "../../auth/guards/core-auth.guard";
import { CurrentUser } from "../../shared/decorators/current-user.decorator";
import { userPhotoUploadOptions } from "../utils/user-photo.upload";
import { UsersService } from "../services/users.service";
import {
  AtualizarUsuarioDto,
  AtualizarUsuarioInput,
  ListarUsuariosQuery,
  ListarUsuariosQueryDto,
  UsuarioIdParamDto,
} from "../dto/users.dto";

@ApiTags("usuarios")
@ApiBearerAuth("JWT")
@Controller("usuarios")
@UseGuards(CoreAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  listar(
    @Query() query: ListarUsuariosQueryDto,
    @CurrentUser() usuario: AuthContext,
  ) {
    return this.usersService.listar(query, usuario);
  }

  @Get(":id")
  buscarPorId(
    @Param() params: UsuarioIdParamDto,
    @CurrentUser() usuario: AuthContext,
  ) {
    return this.usersService.buscarPorId(params.id, usuario);
  }

  @Patch(":id")
  atualizar(
    @Param() params: UsuarioIdParamDto,
    @Body() body: AtualizarUsuarioDto,
    @CurrentUser() usuario: AuthContext,
  ) {
    return this.usersService.atualizar(params.id, body, usuario);
  }

  @Patch(":id/foto")
  @UseInterceptors(FileInterceptor("foto", userPhotoUploadOptions))
  atualizarFoto(
    @Param() params: UsuarioIdParamDto,
    @UploadedFile() file: never,
    @CurrentUser() usuario: AuthContext,
  ) {
    return this.usersService.atualizarFoto(params.id, file, usuario);
  }
}

