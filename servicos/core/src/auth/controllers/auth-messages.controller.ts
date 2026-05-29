import { Controller } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { AuthService } from "../services/auth.service";

@Controller()
export class AuthMessagesController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern("core.auth.validate-token")
  async validarToken(@Payload() data: { token: string }) {
    return this.authService.validarToken(data.token);
  }

  @MessagePattern("core.permissions.get-context")
  async buscarContexto(@Payload() data: { token: string }) {
    return this.authService.validarToken(data.token);
  }
}

