import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../shared/current-user.decorator";
import { ZodValidationPipe } from "../shared/zod-validation.pipe";
import { AuthContext } from "./auth.types";
import { AuthService } from "./auth.service";
import { CoreAuthGuard } from "./core-auth.guard";
import { loginSchema } from "./auth.schema";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(
    @Body(new ZodValidationPipe(loginSchema)) body: unknown,
    @Req() request: Request,
  ) {
    return this.authService.login(body as never, request.ip);
  }

  @Get("me")
  @UseGuards(CoreAuthGuard)
  @ApiBearerAuth("JWT")
  me(@CurrentUser() usuario: AuthContext) {
    return usuario;
  }
}
