import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../shared/decorators/current-user.decorator";
import { AuthContext } from "../types/auth.types";
import { AuthService } from "../services/auth.service";
import { LoginDto } from "../dto/auth.dto";
import { CoreAuthGuard } from "../guards/core-auth.guard";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() body: LoginDto, @Req() request: Request) {
    return this.authService.login(body, request.ip);
  }

  @Get("me")
  @UseGuards(CoreAuthGuard)
  @ApiBearerAuth("JWT")
  me(@CurrentUser() usuario: AuthContext) {
    return usuario;
  }
}

