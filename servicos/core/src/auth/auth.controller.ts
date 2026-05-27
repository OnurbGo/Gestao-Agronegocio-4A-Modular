import { Body, Controller, Get, Post, Req, UseGuards, UsePipes } from "@nestjs/common";
import { Request } from "express";
import { CurrentUser } from "../shared/current-user.decorator";
import { ZodValidationPipe } from "../shared/zod-validation.pipe";
import { AuthContext } from "./auth.types";
import { AuthService } from "./auth.service";
import { CoreAuthGuard } from "./core-auth.guard";
import { loginSchema } from "./auth.schema";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @UsePipes(new ZodValidationPipe(loginSchema))
  login(@Body() body: unknown, @Req() request: Request) {
    return this.authService.login(body as never, request.ip);
  }

  @Get("me")
  @UseGuards(CoreAuthGuard)
  me(@CurrentUser() usuario: AuthContext) {
    return usuario;
  }
}
